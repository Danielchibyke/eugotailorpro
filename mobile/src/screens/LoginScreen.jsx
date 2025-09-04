import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showNotification } = useNotification();

    const handleLogin = async () => {
        console.log('handleLogin triggered');
        if (!email || !password) {
            console.log('Email or password missing');
            showNotification('Please enter both email and password.', 'error');
            return;
        }
        console.log('Setting loading to true ');
        setLoading(true);
       
        try {
            console.log('Calling login function from AuthContext');
            await login(email, password);
            console.log('Login function call finished');
        } catch (err) {
            console.error('Error during login:', err);
            showNotification(err.response?.data?.msg || 'Login failed. Please check your credentials.', 'error');
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    };
    

    return (
        <BackgroundContainer>
            <View style={styles.container}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.COLORS.textDark}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                />
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={theme.COLORS.textDark}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={theme.COLORS.textLight} />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Don't have an account? Register</Text>
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
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.xl,
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
        borderRadius: theme.BORDERRADIUS.xl,
        alignItems: 'center',
        justifyContent: 'center',
        height: 45,
        marginBottom: theme.SPACING.md, // Adjusted margin for consistency
    },
    buttonText: {
        color: theme.COLORS.textLight,
        fontSize: theme.FONT_SIZES.button,
        fontWeight: 'bold',
    },
    linkText: {
        color: theme.COLORS.textLight,
        marginTop: theme.SPACING.md,
    },
});

export default LoginScreen;