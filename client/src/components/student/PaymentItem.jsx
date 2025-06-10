const PaymentItem = ({ payment}) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    const getStatusClass = (status) => {
        switch( status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';  
        }
    };

    return (
        <div className="flex items-center">
            <div className="flex-1">
                <h4 className="font-medium">{payment.description}</h4>
                <p className="text-sm">{formatDate(payment.date)}</p>
            </div>

            <div className="flex">
                <span className={`px-2 py-1 rounded-full text-sx font-medium ${getStatusClass(payment.status)}`}>
                    {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                </span>
                <span className="font-semibold">
                    {formatAmount(payment.amount)}
                </span>
            </div>
        </div>
    )
}

export default PaymentItem;