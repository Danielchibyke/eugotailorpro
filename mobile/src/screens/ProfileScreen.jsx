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
                    source={{ uri: user.profilePicture || 'https://via.placeholder.com/150' }}
                    style={styles.profileImage}
                />
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('EditProfile')}
            >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
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
        width: 120,
        height: 120,
        borderRadius: 60,
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
});

export default ProfileScreen;
