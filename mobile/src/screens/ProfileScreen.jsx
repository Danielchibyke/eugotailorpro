import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: 'https://www.gravatar.com/avatar/?d=mp' }}
                    style={styles.profileImage}
                />
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={{ marginTop: theme.SPACING.lg }}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="person-outline" size={24} style={styles.actionIcon} />
                    <Text style={styles.actionButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                {user?.role === 'admin' && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('UserManagement')}
                    >
                        <Ionicons name="people-outline" size={24} style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>User Management</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.COLORS.white }]} onPress={logout}>
                    <Ionicons name="log-out-outline" size={24} color={theme.COLORS.danger} />
                    <Text style={[styles.actionButtonText, { color: theme.COLORS.danger }]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.md,
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    profileContainer: {
        alignItems: 'center',
        padding: theme.SPACING.lg,
    },
    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: theme.SPACING.md,
    },
    userName: {
        fontSize: theme.FONT_SIZES.xl,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    userEmail: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.sm,
    },
    editProfileButton: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginHorizontal: theme.SPACING.lg,
        alignItems: 'center',
    },
    editProfileButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.md,
    },
    logoutButton: {
        marginTop: theme.SPACING.md,
        backgroundColor: theme.COLORS.danger,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginHorizontal: theme.SPACING.lg,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.md,
    },
    userManagementButton: {
        marginTop: theme.SPACING.md,
        backgroundColor: theme.COLORS.darkPrimary,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.cardBackground,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginHorizontal: theme.SPACING.lg,
        marginBottom: theme.SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
        marginLeft: theme.SPACING.sm,
        fontWeight: '500',
    },
    actionIcon: {
        color: theme.COLORS.primary,
    },
});

export default ProfileScreen;
