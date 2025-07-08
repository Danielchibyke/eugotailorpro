import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const ClientCard = ({ client, onView, onEdit, onDelete }) => (
    <TouchableOpacity style={styles.card} onPress={() => onView(client)}>
        <View style={styles.info}>
            <Text style={styles.name}>{client.name}</Text>
            <Text style={styles.contact}>{client.phone}</Text>
            <Text style={styles.contact}>{client.email}</Text>
        </View>
        <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(client)} style={styles.actionButton}>
                <Ionicons name="create-outline" size={24} color={theme.COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(client._id)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={24} color={theme.COLORS.error} />
            </TouchableOpacity>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
        borderLeftWidth: 5,
        borderLeftColor: theme.COLORS.accent,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    contact: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: theme.SPACING.md,
    },
});

export default ClientCard;