import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { showNotification } = useNotification();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Registration failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BackgroundContainer>
            <View style={styles.container}>
                <Text style={styles.title}>Register</Text>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.COLORS.textDark}
                    value={name}
                    onChangeText={setName}
                />
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.COLORS.textDark}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.COLORS.textDark}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={theme.COLORS.primary} />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderRadius: theme.BORDERRADIUS.md,
        alignItems: 'center',
    },
    title: {
        fontSize: theme.FONT_SIZES.h2,
        color: theme.COLORS.textLight,
        marginBottom: theme.SPACING.lg,
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: 'rgba(248,243,242,0.91)',
        borderRadius: 15,
        paddingHorizontal: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        color: theme.COLORS.textDark,
    },
    inputLabel: {
        alignSelf: 'flex-start',
        color: theme.COLORS.textLight,
        fontSize: theme.FONT_SIZES.body,
        marginBottom: theme.SPACING.xs,
        marginLeft: theme.SPACING.xs,
    },
    button: {
        width: '100%',
        backgroundColor: theme.COLORS.darkPrimary,
        padding: theme.SPACING.sm,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        height: 45,
        marginBottom: theme.SPACING.md, // Adjusted margin for consistency
    },
    buttonText: {
        color: theme.COLORS.primary,
        fontSize: theme.FONT_SIZES.button,
        fontWeight: 'bold',
    },
    linkText: {
        color: theme.COLORS.textLight,
        marginTop: theme.SPACING.md,
    },
});

export default RegisterScreen;