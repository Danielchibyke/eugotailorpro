
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const ClientSearchModal = ({ visible, clients, onSelect, onClose, onAddNew }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderClientItem = ({ item }) => (
        <TouchableOpacity style={styles.clientItem} onPress={() => onSelect(item)}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientPhone}>{item.phone}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Select a Client</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color={theme.COLORS.textMedium} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.COLORS.textMedium} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                    />
                </View>

                <FlatList
                    data={filteredClients}
                    renderItem={renderClientItem}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateText}>No clients found.</Text>
                            <Text style={styles.emptyStateSubText}>Try a different search or add a new client.</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <TouchableOpacity style={styles.addNewButton} onPress={onAddNew}>
                            <Ionicons name="add-circle-outline" size={24} color={theme.COLORS.primary} />
                            <Text style={styles.addNewButtonText}>Add New Client</Text>
                        </TouchableOpacity>
                    }
                    contentContainerStyle={styles.listContainer}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
        paddingTop: 50, // For status bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.SPACING.lg,
        paddingBottom: theme.SPACING.md,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        margin: theme.SPACING.lg,
        paddingHorizontal: theme.SPACING.md,
    },
    searchIcon: {
        marginRight: theme.SPACING.sm,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: theme.FONT_SIZES.body,
    },
    listContainer: {
        paddingHorizontal: theme.SPACING.lg,
    },
    clientItem: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.lg,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
    },
    clientName: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: '500',
        color: theme.COLORS.textDark,
    },
    clientPhone: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textMedium,
    },
    emptyStateSubText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.lg,
        borderWidth: 1,
        borderColor: theme.COLORS.primary,
    },
    addNewButtonText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginLeft: theme.SPACING.sm,
    },
});

export default ClientSearchModal;
