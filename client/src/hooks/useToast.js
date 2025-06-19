import { useState } from "react";

export const useToast = () => {
    const [toast, setToast] = useState(null);

    const showSuccess = (message) => {
        setToast({message, type: 'success', id: Date.now()});

        
    }

    const showError = (message) => {
            setToast({message, type: 'error', id: Date.now()});
        }

        const hideToast = () => {
            setToast(null);
        };

        return { toast, showSuccess, showError, hideToast}
}