import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getApi } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';
import ImageZoomModal from '../components/ImageZoomModal'; // Import the modal

const GalleryScreen = ({ navigation, route }) => {
    const { selectMode, multiple, onSelect, selectedDesigns: initialSelectedDesigns } = route.params || {};
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localSelectedDesigns, setLocalSelectedDesigns] = useState(initialSelectedDesigns || []);
    const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
    const [selectedImage, setSelectedImage] = useState(null); // State for selected image URL

    const fetchDesigns = async () => {
        try {
            const response = await getApi().get('/designs');
            setDesigns(response.data);
        } catch (error) {
            console.error('Failed to fetch designs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesigns();
    }, []);

    const handleImagePick = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
        });

        if (!result.canceled) {
            const uris = result.assets.map(asset => asset.uri);
            for (const uri of uris) {
                const formData = new FormData();
                formData.append('image', {
                    uri,
                    name: `photo.jpg`,
                    type: `image/jpeg`,
                });

                try {
                    const response = await getApi().post('/upload/image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    const { imageUrl } = response.data;
                    const newDesign = await getApi().post('/designs', { imageUrl: imageUrl });
                    setDesigns(prevDesigns => [newDesign.data, ...prevDesigns]);
                } catch (error) {
                    console.error('Failed to upload image:', error.message);
                    if (error.response) {
                        console.error('Server response data:', error.response.data);
                        console.error('Server response status:', error.response.status);
                        console.error('Server response headers:', error.response.headers);
                    } else if (error.request) {
                        console.error('No response received:', error.request);
                    } else {
                        console.error('Error setting up request:', error.message);
                    }
                }
            }
        }
    };

    const handleSelectImage = (imageUrl) => {
        if (multiple) {
            const isSelected = localSelectedDesigns.includes(imageUrl);
            if (isSelected) {
                setLocalSelectedDesigns(localSelectedDesigns.filter(url => url !== imageUrl));
            } else {
                setLocalSelectedDesigns([...localSelectedDesigns, imageUrl]);
            }
        } else {
            if (onSelect) {
                onSelect(imageUrl);
                navigation.goBack();
            }
        }
    };

    const handleDone = () => {
        if (onSelect) {
            onSelect(localSelectedDesigns);
            navigation.goBack();
        }
    };

    const handleViewImage = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const renderItem = ({ item }) => {
        const isSelected = localSelectedDesigns.includes(item.imageUrl);
        return (
            <TouchableOpacity
                style={[styles.itemContainer, isSelected && styles.selectedItem]}
                onPress={selectMode ? () => handleSelectImage(item.imageUrl) : () => handleViewImage(item.imageUrl)}
            >
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    onError={(e) => console.log('GalleryScreen Image Error:', e.nativeEvent.error)}
                />
                {isSelected && (
                    <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.success} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color={theme.COLORS.primary} style={{ flex: 1 }} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectMode ? 'Select Designs' : 'Design Gallery'}</Text>
                {!selectMode && (
                    <TouchableOpacity onPress={handleImagePick}>
                        <Ionicons name="add" size={30} color={theme.COLORS.primary} />
                    </TouchableOpacity>
                )}
                {selectMode && multiple && (
                    <TouchableOpacity onPress={handleDone}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                )}
                {selectMode && !multiple && <View style={{ width: 30 }} /> /* Spacer for alignment */}
            </View>
            <FlatList
                data={designs}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                numColumns={3}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<Text style={styles.emptyText}>No designs found.</Text>}
            />
            {selectedImage && (
                <ImageZoomModal
                    imageUrl={selectedImage}
                    visible={modalVisible}
                    onClose={handleCloseModal}
                />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    listContainer: {
        padding: theme.SPACING.sm,
    },
    itemContainer: {
        flex: 1,
        margin: theme.SPACING.sm,
        aspectRatio: 1,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: theme.BORDERRADIUS.sm,
        backgroundColor: theme.COLORS.lightGray, // Added for debugging
        borderWidth: 1, // Added for debugging
        borderColor: theme.COLORS.border, // Added for debugging
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.SPACING.lg,
        fontSize: theme.FONT_SIZES.md,
        color: theme.COLORS.textMedium,
    },
    selectedItem: {
        borderWidth: 3,
        borderColor: theme.COLORS.success,
        borderRadius: theme.BORDERRADIUS.md,
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    doneText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
});

export default GalleryScreen;
