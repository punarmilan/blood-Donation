import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CreditCard, CheckCircle2, ShieldCheck, Heart } from "lucide-react";

export default function RequestPayment() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const token = localStorage.getItem("jwt_token") || localStorage.getItem("token") || localStorage.getItem("recipient-token");

  useEffect(() => {
    // Dynamic load Razorpay checkout script if not present
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const fetchRequestDetails = async () => {
      try {
        const res = await fetch(`/api/request-flow/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRequest(data.data);
        } else {
          toast.error(data.message || "Failed to fetch request details");
        }
      } catch (err) {
        toast.error("Error loading payment information");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/request-flow/${requestId}/create-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to initiate payment");
        setPaying(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: "INR",
        name: "Raktdaan",
        description: `Blood processing fee — Request ${requestId}`,
        order_id: data.orderId,
        prefill: {
          name: data.payerName || "",
          contact: data.payerMobile || ""
        },
        theme: { color: "#E24B4A" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`/api/request-flow/${requestId}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("Payment verified successfully!");
              setRequest(prev => ({ ...prev, paymentStatus: "paid", status: verifyData.data.status }));
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            toast.error("Payment verification request failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment window dismissed");
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed: " + response.error.description);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error("Error connecting to payment gateway");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E24B4A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-500 font-bold">Request not found.</p>
      </div>
    );
  }

  const bloodComp = request.bloodComponent || request.component;
  const rate = bloodComp === "Platelets" || bloodComp === "Plasma" ? 300 : 1100;
  const totalAmount = rate * request.units;

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-[#0f0f15] border border-zinc-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Element */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E24B4A]/10 rounded-full blur-3xl pointer-events-none" />

        {request.paymentStatus === "paid" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-white">Payment Successful!</h2>
            <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
              Blood processing fee ₹{totalAmount.toLocaleString()} safely receive ho gaya hai.
            </p>
            <div className="bg-[#07070a] border border-zinc-900 rounded-2xl p-4 mt-6 text-xs text-left text-slate-400 space-y-2">
              <p>📍 <strong>Next Steps:</strong></p>
              <p>1. Blood Bank physical checks complete karega.</p>
              <p>2. Complete hone pe **OTP aapke WhatsApp pe** bheja jayega.</p>
              <p>3. Receiver OTP bata kar blood collect kar sakta hai.</p>
            </div>
            <button
              onClick={() => navigate(`/recipient/request/${requestId}`)}
              className="mt-8 w-full bg-zinc-900 border border-zinc-800 hover:text-white text-slate-300 py-3 rounded-2xl text-sm font-bold transition duration-200 cursor-pointer"
            >
              Go to Tracking Panel
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#E24B4A]/10 rounded-xl text-[#E24B4A]">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Processing Fee Payment</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{request.requestId}</p>
              </div>
            </div>

            <div className="bg-[#07070a] border border-zinc-900 rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Patient Name</span>
                <span className="text-white font-bold">{request.patientName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Blood Group / Component</span>
                <span className="text-white font-bold">{request.bloodGroup} ({request.bloodComponent || request.component || "Not specified"})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Required Units</span>
                <span className="text-white font-bold">{request.units} Unit(s)</span>
              </div>
              <div className="h-[1px] bg-zinc-900" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs font-bold">Total Processing Fee</span>
                <span className="text-lg font-black text-white">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-[#E24B4A] hover:bg-[#c93d3c] disabled:opacity-50 text-white py-3.5 rounded-2xl text-sm font-black transition duration-200 cursor-pointer shadow-[0_15px_30px_rgba(226,75,74,0.2)] flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ₹{totalAmount.toLocaleString()}</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Razorpay Secure 256-bit SSL encrypted checkout.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
