import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
    const { user: currentUser } = useAuth(); // Current logged-in user
    const { showNotification } = useNotification();
    const api = useMemo(() => getApi(), []); // Memoize the API instance

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState(null); // To track which user is being updated

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching users from /auth/users...'); // Debug log
            const { data } = await api.get('/auth/users');
            console.log('Users fetched successfully:', data); // Debug log
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            console.error('Error response data:', error.response?.data); // Debug log
            showNotification(error.response?.data?.msg || 'Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [api, showNotification]);

    const handleRoleChange = useCallback(async (userId, newRole) => {
        setUpdatingUserId(userId);
        try {
            await api.put(`/auth/users/${userId}/role`, { role: newRole });
            showNotification('User role updated successfully!', 'success');
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to update user role:', error);
            showNotification(error.response?.data?.msg || 'Failed to update user role.', 'error');
        } finally {
            setUpdatingUserId(null);
        }
    }, [api, showNotification, fetchUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
                            fetchUsers(); // Refresh the list
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
        <View style={styles.userCard}>
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
                        enabled={currentUser?.role === 'admin' && item._id !== currentUser._id} // Only admin can change roles, and not their own
                    >
                        <Picker.Item label="Admin" value="admin" />
                        <Picker.Item label="Staff" value="staff" />
                        <Picker.Item label="User" value="user" />
                    </Picker>
                    {updatingUserId === item._id && (
                        <ActivityIndicator size="small" color={theme.COLORS.primary} style={styles.activityIndicator} />
                    )}
                </View>
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
    }

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.sm,
        borderWidth: 1, // Added border
        borderColor: theme.COLORS.border, // Added border color
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flex: 1,
        marginRight: theme.SPACING.sm,
    },
    nameAndRole: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.SPACING.xs,
    },
    userName: {
        fontSize: theme.FONT_SIZES.lg, // Increased font size
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginRight: theme.SPACING.sm,
    },
    userEmail: {
        fontSize: theme.FONT_SIZES.sm, // Slightly reduced font size
        color: theme.COLORS.textMedium,
    },
    roleBadge: {
        paddingHorizontal: theme.SPACING.xs,
        paddingVertical: 2,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    roleBadgeText: {
        fontSize: theme.FONT_SIZES.xs,
        fontWeight: 'bold',
        color: theme.COLORS.white,
    },
    rolePickerContainer: {
        borderWidth: 1,
        borderColor: theme.COLORS.border,
        borderRadius: theme.BORDERRADIUS.sm,
        overflow: 'hidden',
        minWidth: 120, // Increased width
        backgroundColor: theme.COLORS.backgroundApp, // Subtle background
    },
    rolePicker: {
        height: 40,
        width: '100%',
        color: theme.COLORS.textDark,
    },
    activityIndicator: {
        position: 'absolute',
        right: theme.SPACING.xs,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.SPACING.sm,
    },
    deleteButton: {
        backgroundColor: theme.COLORS.danger,
        padding: theme.SPACING.xs,
        borderRadius: theme.BORDERRADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
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