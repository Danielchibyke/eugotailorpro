import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../styles/theme';

const AccessDeniedScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Ionicons name="lock-closed-outline" size={100} color={theme.COLORS.danger} />
            <Text style={styles.title}>Access Denied</Text>
            <Text style={styles.message}>You do not have permission to view this page.</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.buttonText}>Go to Dashboard</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundApp,
        padding: theme.SPACING.lg,
    },
    title: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginTop: theme.SPACING.md,
        marginBottom: theme.SPACING.sm,
    },
    message: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
        textAlign: 'center',
        marginBottom: theme.SPACING.lg,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        paddingVertical: theme.SPACING.md,
        paddingHorizontal: theme.SPACING.lg,
        borderRadius: theme.BORDERRADIUS.md,
        marginTop: theme.SPACING.md,
    },
    buttonText: {
        color: theme.COLORS.white,
        fontSize: theme.FONT_SIZES.md,
        fontWeight: 'bold',
    },
});

export default AccessDeniedScreen;
