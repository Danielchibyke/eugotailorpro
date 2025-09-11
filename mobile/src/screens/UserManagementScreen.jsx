import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const UserManagementScreen = () => {
    const navigation = useNavigation();
    const { user: currentUser } = useAuth();
    const { showNotification } = useNotification();
    const api = useMemo(() => getApi(), []);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showNotification(error.response?.data?.msg || 'Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [api, showNotification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = useCallback(async (userId, newRole) => {
        setUpdatingUserId(userId);
        try {
            await api.put(`/auth/users/${userId}/role`, { role: newRole });
            showNotification('User role updated successfully!', 'success');
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user role:', error);
            showNotification(error.response?.data?.msg || 'Failed to update user role.', 'error');
        } finally {
            setUpdatingUserId(null);
        }
    }, [api, showNotification, fetchUsers]);

    const handleToggleActive = useCallback(async (userId, currentStatus, forceActivate = false) => {
        if (userId === currentUser._id) {
            showNotification('You cannot deactivate/reactivate your own account.', 'error');
            return;
        }

        const newStatus = forceActivate ? true : !currentStatus;
        const action = newStatus ? 'activate' : 'deactivate';
        const alertTitle = newStatus ? 'Activate User' : 'Deactivate User';
        const alertMessage = newStatus
            ? `Are you sure you want to activate this user? They will be able to log in.`
            : `Are you sure you want to deactivate this user? They will not be able to log in.`;

        const performUpdate = async () => {
            setUpdatingUserId(userId);
            try {
                await api.put(`/auth/users/${userId}/status`, { isActive: newStatus });
                showNotification(`User ${action}d successfully!`, 'success');
                fetchUsers();
            } catch (error) {
                console.error(`Failed to ${action} user:`, error);
                showNotification(error.response?.data?.msg || `Failed to ${action} user.`, 'error');
            } finally {
                setUpdatingUserId(null);
            }
        };

        if (forceActivate) { // If activating via dedicated button, proceed directly
            performUpdate();
        } else { // If toggling via switch, show confirmation for both activate/deactivate
            Alert.alert(
                alertTitle,
                alertMessage,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: action === 'deactivate' ? 'Deactivate' : 'Activate', style: 'destructive', onPress: performUpdate },
                ]
            );
        }
    }, [api, showNotification, fetchUsers, currentUser]);

    const handleDeleteUser = useCallback(async (userId, userRole) => {
        if (userId === currentUser._id) {
            showNotification('You cannot delete your own account.', 'error');
            return;
        }

        if (userRole === 'admin') {
            const adminCount = users.filter(user => user.role === 'admin').length;
            if (adminCount <= 1) {
                showNotification('Cannot delete the last admin user.', 'error');
                return;
            }
        }

        Alert.alert(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setUpdatingUserId(userId);
                        try {
                            await api.delete(`/auth/users/${userId}`);
                            showNotification('User deleted successfully!', 'success');
                            fetchUsers();
                        } catch (error) {
                            console.error('Failed to delete user:', error);
                            showNotification(error.response?.data?.msg || 'Failed to delete user.', 'error');
                        } finally {
                            setUpdatingUserId(null);
                        }
                    },
                },
            ]
        );
    }, [api, showNotification, fetchUsers, currentUser, users]);

    const renderUserItem = ({ item }) => (
        <View style={[styles.userCard, !item.isActive && styles.deactivatedCard]}>
            <View style={styles.userInfo}>
                <View style={styles.nameAndRole}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
                        <Text style={styles.roleBadgeText}>{item.role.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={styles.actionsContainer}>
                <View style={styles.rolePickerContainer}>
                    <Picker
                        selectedValue={item.role}
                        onValueChange={(itemValue) => handleRoleChange(item._id, itemValue)}
                        style={styles.rolePicker}
                        enabled={currentUser?.role === 'admin' && item._id !== currentUser._id && item.isActive} // Disabled if deactivated
                    >
                        <Picker.Item label="Admin" value="admin" />
                        <Picker.Item label="Staff" value="staff" />
                        <Picker.Item label="User" value="user" />
                    </Picker>
                </View>
                <View style={styles.actionButtons}>
                    {item.isActive ? ( // Show switch if active
                        <View style={styles.switchContainer}>
                            <Switch
                                trackColor={{ false: '#767577', true: theme.COLORS.primary }}
                                thumbColor={item.isActive ? theme.COLORS.white : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => handleToggleActive(item._id, item.isActive)}
                                value={item.isActive}
                                disabled={updatingUserId === item._id || item._id === currentUser._id}
                            />
                            <Text style={styles.switchLabel}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                    ) : ( // Show activate button if deactivated
                        currentUser?.role === 'admin' && item._id !== currentUser._id && (
                            <TouchableOpacity
                                style={styles.activateButton}
                                onPress={() => handleToggleActive(item._id, item.isActive, true)} // Force activate
                                disabled={updatingUserId === item._id}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color={theme.COLORS.white} />
                                <Text style={styles.activateButtonText}>Activate</Text>
                            </TouchableOpacity>
                        )
                    )}
                    {currentUser?.role === 'admin' && item._id !== currentUser._id && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteUser(item._id, item.role)}
                            disabled={updatingUserId === item._id}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.COLORS.white} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {updatingUserId === item._id && (
                <View style={styles.updatingOverlay}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                </View>
            )}
        </View>
    );

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'admin': return { backgroundColor: theme.COLORS.primary };
            case 'staff': return { backgroundColor: theme.COLORS.accent };
            case 'user': return { backgroundColor: theme.COLORS.textMedium };
            default: return { backgroundColor: theme.COLORS.border };
        }
    };

    if (loading) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            </BackgroundContainer>
        );
    };

    return (
        <BackgroundContainer>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={{ width: 24 }} />
            </View>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No users found.</Text>
                    </View>
                }
            />
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.SPACING.sm,
        color: theme.COLORS.textMedium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.md,
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
        backgroundColor: theme.COLORS.backgroundCard,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    listContent: {
        padding: theme.SPACING.md,
    },
    userCard: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        borderWidth: 1,
        borderColor: theme.COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    deactivatedCard: {
        backgroundColor: '#f0f0f0', // A slightly different background for deactivated users
        opacity: 0.7,
    },
    userInfo: {
        marginBottom: theme.SPACING.md,
    },
    nameAndRole: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.SPACING.xs,
    },
    userName: {
        fontSize: theme.FONT_SIZES.xl,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginRight: theme.SPACING.sm,
    },
    userEmail: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
    },
    roleBadge: {
        paddingHorizontal: theme.SPACING.sm,
        paddingVertical: 2,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    roleBadgeText: {
        fontSize: theme.FONT_SIZES.xs,
        fontWeight: 'bold',
        color: theme.COLORS.white,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.SPACING.md,
        borderTopWidth: 1,
        borderTopColor: theme.COLORS.border,
        paddingTop: theme.SPACING.md,
    },
    rolePickerContainer: {
        flex: 1,
        borderWidth: 0.3,
        borderColor: theme.COLORS.border,
        borderRadius: theme.BORDERRADIUS.sm,
        overflow: 'hidden',
        backgroundColor: theme.COLORS.backgroundApp,
        marginRight: theme.SPACING.md,
        justifyContent: 'center',
        height: 40,

    },
    rolePicker: {
        height: 70,
        width: '100%',
        color: theme.COLORS.textDark,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.SPACING.sm,
        marginLeft: theme.SPACING.md,
    },
    switchContainer: {
        alignItems: 'center',
        marginHorizontal: theme.SPACING.md,
    },
    switchLabel: {
        fontSize: theme.FONT_SIZES.xs,
        color: theme.COLORS.textMedium,
        marginTop: 2,
    },
    activateButton: {
        backgroundColor: theme.COLORS.success,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row', // To align icon and text
        gap: theme.SPACING.xs, // Space between icon and text
    },
    activateButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.sm,
    },
    deleteButton: {
        backgroundColor: theme.COLORS.danger,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    updatingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.BORDERRADIUS.md,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.SPACING.xxl,
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        color: theme.COLORS.textMedium,
    },
});

export default UserManagementScreen;
