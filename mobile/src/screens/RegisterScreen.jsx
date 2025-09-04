import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApi } from '../utils/api';
import { theme } from '../styles/theme';
import BackgroundContainer from '../components/BackgroundContainer';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        setLoading(true);
        try {
            await getApi().post('/auth/register', { name, email, password, role });
            showNotification('User registered successfully!', 'success');
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Registration failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BackgroundContainer>
            <View style={styles.container}>
                <Text style={styles.title}>Register New User</Text>
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
                    autoCompleteType="email"
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
                {user?.role === 'admin' && (
                    <>
                        <Text style={styles.inputLabel}>Role</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={role}
                                onValueChange={(itemValue) => setRole(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="User" value="user" />
                                <Picker.Item label="Admin" value="admin" />
                            </Picker>
                        </View>
                    </>
                )}
                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={theme.COLORS.textLight} />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
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
        marginBottom: theme.SPACING.md,
    },
    buttonText: {
        color: theme.COLORS.textLight,
        fontSize: theme.FONT_SIZES.button,
        fontWeight: 'bold',
    },
    pickerContainer: {
        width: '100%',
        height: 45,
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.xl,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
    },
    picker: {
        color: theme.COLORS.textDark,
    },
});

export default RegisterScreen;
