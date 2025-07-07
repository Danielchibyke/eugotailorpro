import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const TopNavbar = () => {
    const { user, logout } = useAuth();
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} />
                <TouchableOpacity onPress={() => setProfileMenuOpen(!isProfileMenuOpen)}>
                    <Ionicons name="person-circle-outline" size={30} color={theme.COLORS.primary} />
                </TouchableOpacity>
            </View>
            {isProfileMenuOpen && user && (
                <View style={styles.profileMenu}>
                    <Text style={styles.profileText}>{user.name}</Text>
                    <Text style={styles.profileText}>{user.email}</Text>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.COLORS.backgroundCard,
        paddingHorizontal: theme.SPACING.md,
        paddingTop: 40,
        paddingBottom: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
        zIndex: 9999
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 40,
        resizeMode: 'contain',
    },
    profileMenu: {
        position: 'absolute',
        top: 80,
        right: 10,
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm,
        padding: theme.SPACING.md,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 9999,
        
    },
    profileText: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
    },
    logoutButton: {
        backgroundColor: theme.COLORS.danger,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
    },
});

export default TopNavbar;