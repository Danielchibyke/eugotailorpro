import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

const TopNavbar = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} />
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-circle-outline" size={30} color={theme.COLORS.primary} />
                </TouchableOpacity>
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
});

export default TopNavbar;
