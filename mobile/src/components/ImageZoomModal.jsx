import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Ionicons } from '@expo/vector-icons';

const ImageZoomModal = ({ imageUrl, visible, onClose }) => {
  const images = [{
    url: imageUrl,
  }];

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <ImageViewer
        imageUrls={images}
        enableSwipeDown={true}
        onSwipeDown={onClose}
        renderHeader={() => (
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={30} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButton: {
    padding: 5,
  },
});

export default ImageZoomModal;