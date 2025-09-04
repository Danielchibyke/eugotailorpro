import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const navigation = useNavigation();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) {
        navigation.replace('Login');
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        navigation.replace('Dashboard');
        return null;
    }

    return children;
};

export default ProtectedRoute;