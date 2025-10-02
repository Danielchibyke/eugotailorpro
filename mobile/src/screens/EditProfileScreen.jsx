import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getApi } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateRealmUser } = useAuth(); // Get updateRealmUser from AuthContext
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [receiveReminders, setReceiveReminders] = useState(user?.receiveReminders ?? true);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    const handleUpdate = async () => {
        if (password !== confirmPassword) {
            showNotification('Passwords do not match.', 'error');
            return;
        }

        setLoading(true);
        try {
            const updatedUserData = {
                name,
                email,
                receiveReminders,
            };

            if (password) {
                updatedUserData.password = password;
            }

            await getApi().put('/auth/profile', updatedUserData);

            showNotification('Profile updated successfully!', 'success');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification(error.response?.data?.msg || 'Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Receive Reminders</Text>
                    <Switch
                        trackColor={{ false: theme.COLORS.border, true: theme.COLORS.primary }}
                        thumbColor={theme.COLORS.white}
                        ios_backgroundColor={theme.COLORS.border}
                        onValueChange={setReceiveReminders}
                        value={receiveReminders}
                    />
                </View>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
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
    form: {
        padding: theme.SPACING.lg,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
    },
    saveButton: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    saveButtonText: {
        color: theme.COLORS.white,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.md,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.lg,
    },
    switchLabel: {
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textDark,
    },
});

export default EditProfileScreen;
