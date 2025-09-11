import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeactivatedAlert, setShowDeactivatedAlert] = useState(false);
    const [deactivatedMessage, setDeactivatedMessage] = useState('');
    const { login } = useAuth();
    const { showNotification } = useNotification();

    const handleLogin = async () => {
        setShowDeactivatedAlert(false); // Hide previous alert
        if (!email || !password) {
            showNotification('Please enter both email and password.', 'error');
            return;
        }
        setLoading(true);
       
        try {
            await login(email, password);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
            if (errorMessage === 'Your account is deactivated. Please contact support.') {
                setDeactivatedMessage(errorMessage);
                setShowDeactivatedAlert(true);
            } else {
                showNotification(errorMessage, 'error');
            }
        } finally {
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
                </View>

            {showDeactivatedAlert && (
                <View style={styles.deactivatedAlertCard}>
                    <Text style={styles.deactivatedAlertText}>{deactivatedMessage}</Text>
                    <TouchableOpacity onPress={() => setShowDeactivatedAlert(false)} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={24} color={theme.COLORS.textLight} />
                    </TouchableOpacity>
                </View>
            )}
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
    deactivatedAlertCard: {
        position: 'absolute',
        top: 100, // Fixed top position for debugging
        left: '5%',
        right: '5%',
        backgroundColor: theme.COLORS.danger, // Use danger color for this specific alert
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 99999, // Very high zIndex for debugging
    },
    deactivatedAlertText: {
        color: theme.COLORS.textLight,
        flex: 1,
        marginRight: theme.SPACING.sm,
        fontSize: theme.FONT_SIZES.md,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: theme.SPACING.xs,
    },
});

export default LoginScreen;
