import PaymentItem from "./PaymentItem";

const PaymentHistory = ({ payments }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Payment History</h2>

      {!payments || payments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No Payment history found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
