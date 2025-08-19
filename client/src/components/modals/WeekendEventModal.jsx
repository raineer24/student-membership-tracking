import React, { useState, useCallback, useEffect, useRef} from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const WeekendEventModal = ({ isOpen, onClose, onEventCreated, existingEvents }) => {
    const { token} = useAuth();
    const { showSuccess, showError} = useToast();

    const [formData, setFormData] = useState({
        eventType: 'NO_CLASSES',
        title: '',
        message: '',
        startDate: '',
        endDate: '',
        sendSMS: true,
        priority: 'normal',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const modalRef = useRef(null)

    // Reset form when modal opens/closes
}

export default WeekendEventModal;