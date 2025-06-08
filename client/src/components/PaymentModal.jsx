import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const PaymentModal = ({
  isOpen,
  onClose,
  student = null,
  onPaymentSuccess,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //FormState
  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
  });

  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💵 Cash" },
    { value: "BANK_TRANSFER", label: "🏦 Bank Transfer" },
    { value: "ONLINE", label: "🌐 Online Payment" },
    { value: "CHECK", label: "📝 Check" },
    { value: "OTHER", label: "📋 Other" },
  ];

  const membershipPrices = {
    MONTHLY: 1400,
    YEARLY: 16800,
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMembershipTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      membershipType: type,
      amount: membershipPrices[type].toString(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefaul();
    if (!student) return;

    setLoading(true);
    setError(null);
  };

  if(!isOpen) return null;

  return (
    <div className="fixed">
        <div className="bg-white">
            {/* HEADER */ }
            <div className="flex">

            </div>

            {/* Student Info */}

            {/* Error Message */}

            {/* Form */}
            <form>
                <div className="space-y-2">

                </div>

                { /* Amount */}
                <div>

                </div>

                 { /* Payment Method */}
                <div>
                    
                </div>

                 { /* Description */}
                <div>
                    
                </div>

                 { /* Extend Membersghip */}
                <div>
                    
                </div>

                 { /* Action Buttons */}
                <div>
                    
                </div>

            </form>
        </div>
    </div>
  )
};

export default PaymentModal;
