import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { useNotification } from '../context/NotificationContext'; // Import useNotification

const TopNavbar = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { unreadCount, fetchUnreadCount } = useNotification(); // Get from context

    useEffect(() => {
        if (isFocused) {
            fetchUnreadCount();
        }
    }, [isFocused, fetchUnreadCount]);

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} />
                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <Ionicons name="notifications-outline" size={30} color={theme.COLORS.primary} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{marginLeft: 15}}>
                        <Ionicons name="person-circle-outline" size={30} color={theme.COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
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
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: theme.COLORS.danger,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: theme.COLORS.textLight,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default TopNavbar;
