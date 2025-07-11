import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Image, Button, ActivityIndicator } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import ImageZoomModal from '../components/ImageZoomModal';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

const AddBookingScreen = ({ navigation, route }) => {
    const { booking } = route.params || {};
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        client: null,
        bookingDate: new Date(),
        deliveryDate: new Date(),
        reminderDate: new Date(),
        status: 'Pending',
        notes: '',
        design: '',
        price: '',
        payment: '',
    });
    const [imageUri, setImageUri] = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const openZoomModal = () => setIsZoomModalVisible(true);
    const closeZoomModal = () => setIsZoomModalVisible(false);
    const [isBookingDatePickerVisible, setBookingDatePickerVisible] = useState(false);
    const [isDeliveryDatePickerVisible, setDeliveryDatePickerVisible] = useState(false);
    const [isReminderDatePickerVisible, setReminderDatePickerVisible] = useState(false);
    const [currentDatePickerField, setCurrentDatePickerField] = useState(null);
    const { showNotification } = useNotification();

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
            setFilteredClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    useEffect(() => {
        if (booking) {
            setFormData({
                client: booking.client?._id,
                bookingDate: new Date(booking.bookingDate),
                deliveryDate: new Date(booking.deliveryDate),
                reminderDate: new Date(booking.reminderDate),
                status: booking.status,
                notes: booking.notes || '',
                design: booking.design || '',
                price: (booking.price || '').toString(),
                payment: (booking.payment || '').toString(),
            });
            if (booking.design) {
                setImageUri(booking.design);
                setUploadedImageUrl(booking.design);
            }
        }
    }, [booking]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            const filtered = clients.filter((client) =>
                client.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients(clients);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const manipResult = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            setImageUri(manipResult.uri);
            await uploadImage(manipResult.uri, manipResult.mimeType || 'image/jpeg');
        }
    };

    const uploadImage = async (uri, mimeType) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', {
            uri: uri,
            name: 'design_image.' + mimeType.split('/')[1],
            type: mimeType,
        });

        try {
            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 520000, // Set client-side timeout to 520 seconds
            });
            console.log('Upload successful, full response object:', response);
            console.log('Upload successful, response data:', response.data);
            console.log('Received imageUrl:', response.data.imageUrl);
            setUploadedImageUrl(response.data.imageUrl);
            showNotification('Image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Image upload error:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error message:', error.message);
            showNotification(error.response?.data?.msg || 'Failed to upload image.', 'error');
            setUploadedImageUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveBooking = async () => {
        if (!formData.client || !formData.price) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        try {
            const bookingData = {
                ...formData,
                price: parseFloat(formData.price),
                payment: parseFloat(formData.payment),
                bookingDate: dayjs(formData.bookingDate),
                deliveryDate: dayjs(formData.deliveryDate),
                reminderDate: dayjs(formData.reminderDate),
                client: formData.client,
                design: uploadedImageUrl || formData.design, // Use uploaded image URL or existing design URL
            };

            if (booking) {
                await api.put(`/bookings/${booking._id}`, bookingData);
                showNotification('Booking updated successfully!', 'success');
            } else {
                await api.post('/bookings', bookingData);
                showNotification('Booking added successfully!', 'success');
            }
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to save booking.', 'error');
        }
    };

    return (
        <View style={styles.container}>
       
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>{booking ? 'Edit Booking' : 'Add Booking'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Client"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.client}
                        onValueChange={(itemValue) => handleInputChange('client', itemValue)}
                        style={styles.picker}
                    >
                    <Picker.Item label="Select a client" value={null} />
                    {filteredClients.map((client) => (
                        <Picker.Item key={client._id} label={client.name} value={client._id} />
                    ))}
                </Picker>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={formData.price}
                    onChangeText={(value) => handleInputChange('price', value)}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Payment"
                    value={formData.payment}
                    onChangeText={(value) => handleInputChange('payment', value)}
                    keyboardType="numeric"
                />
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={pickImage}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Upload Design Image</Text>
                    )}
                </TouchableOpacity>
                {imageUri && (
                    <TouchableOpacity onPress={openZoomModal}>
                        <Image source={{ uri: imageUri }} style={styles.designImagePreview} />
                    </TouchableOpacity>
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Notes"
                    value={formData.notes}
                    onChangeText={(value) => handleInputChange('notes', value)}
                    multiline
                />
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.status}
                        onValueChange={(itemValue) => handleInputChange('status', itemValue)}
                        style={styles.picker}
                    >
                    <Picker.Item label="Pending" value="Pending" />
                    <Picker.Item label="Confirmed" value="Confirmed" />
                    <Picker.Item label="Completed" value="Completed" />
                    <Picker.Item label="Cancelled" value="Cancelled" />
                </Picker>
                </View>
                <Text style={styles.dateLabel}>Booking Date</Text>
                <TouchableOpacity onPress={() => { setCurrentDatePickerField('bookingDate'); setBookingDatePickerVisible(true); }} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.bookingDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <Text style={styles.dateLabel}>Delivery Date</Text>
                <TouchableOpacity onPress={() => { setCurrentDatePickerField('deliveryDate'); setDeliveryDatePickerVisible(true); }} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.deliveryDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <Text style={styles.dateLabel}>Reminder Date</Text>
                <TouchableOpacity onPress={() => { setCurrentDatePickerField('reminderDate'); setReminderDatePickerVisible(true); }} style={styles.dateInputButton}>
                    <Text style={styles.dateInputText}>{dayjs(formData.reminderDate).format('YYYY-MM-DD')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSaveBooking}>
                    <Text style={styles.buttonText}>{booking ? 'Save Changes' : 'Add Booking'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {isBookingDatePickerVisible && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isBookingDatePickerVisible}
                    onRequestClose={() => setBookingDatePickerVisible(false)}
                >
                    <View style={styles.datePickerOverlay}>
                        <View style={styles.datePickerModalView}>
                            <DateTimePicker
                                date={formData.bookingDate ? dayjs(formData.bookingDate) : dayjs()}
                                mode="single"
                                onChange={(params) => {
                                    setBookingDatePickerVisible(false);
                                    handleInputChange('bookingDate', params.date);
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {isDeliveryDatePickerVisible && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isDeliveryDatePickerVisible}
                    onRequestClose={() => setDeliveryDatePickerVisible(false)}
                >
                    <View style={styles.datePickerOverlay}>
                        <View style={styles.datePickerModalView}>
                            <DateTimePicker
                                date={formData.deliveryDate ? dayjs(formData.deliveryDate) : dayjs()}
                                mode="single"
                                onChange={(params) => {
                                    setDeliveryDatePickerVisible(false);
                                    handleInputChange('deliveryDate', params.date);
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {isReminderDatePickerVisible && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isReminderDatePickerVisible}
                    onRequestClose={() => setReminderDatePickerVisible(false)}
                >
                    <View style={styles.datePickerOverlay}>
                        <View style={styles.datePickerModalView}>
                            <DateTimePicker
                                date={formData.reminderDate ? dayjs(formData.reminderDate) : dayjs()}
                                mode="single"
                                onChange={(params) => {
                                    setReminderDatePickerVisible(false);
                                    handleInputChange('reminderDate', params.date);
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {imageUri && (
                <ImageZoomModal
                    imageUrl={imageUri}
                    visible={isZoomModalVisible}
                    onClose={closeZoomModal}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    content: {
        padding: theme.SPACING.md,
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
        textAlign: 'center',
    },
    picker: {
        backgroundColor: theme.COLORS.backgroundCard,
        marginBottom: theme.SPACING.md,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dateLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
    },
    pickerContainer: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
        // On iOS, the picker needs a fixed height to render correctly inside a modal.
        ...Platform.select({
            ios: {
                height: 200,
            },
        }),
    },
    picker: {
        width: '100%',
        ...Platform.select({
            android: {
                height: 50,
                color: theme.COLORS.textDark,
            },
            ios: {
                // Height is set in container
            },
        }),
    },
    dateInputButton: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    datePickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    datePickerModalView: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.lg,
        padding: theme.SPACING.lg,
    },
});

export default AddBookingScreen;
""