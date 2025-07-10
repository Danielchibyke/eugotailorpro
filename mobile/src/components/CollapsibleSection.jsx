import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const CollapsibleSection = ({ title, children }) => {
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapsed = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCollapsed(!collapsed);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={toggleCollapsed} style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Ionicons
                    name={collapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                    size={24}
                    color={theme.COLORS.primary}
                />
            </TouchableOpacity>
            {!collapsed && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.SPACING.md,
        backgroundColor: theme.COLORS.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    title: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    content: {
        padding: theme.SPACING.md,
    },
});

export default CollapsibleSection;
