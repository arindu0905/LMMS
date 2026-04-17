import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Star, MessageSquare } from 'lucide-react';

const Feedback = () => {
    const [feedbackList, setFeedbackList] = useState([]);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await api.get('/feedback');
            setFeedbackList(res.data);
        } catch (err) {
            console.error('Error fetching feedback:', err);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Customer Feedback</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbackList.map(item => (
                    <div key={item.id || item._id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/40 p-6 flex gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 flex-shrink-0">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{item.customerName}</h3>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2 border border-blue-200">
                                    Product Review
                                </span>
                                <div className="flex items-center gap-0.5 text-yellow-400 ml-auto">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < item.rating ? "currentColor" : "none"} strokeWidth={i < item.rating ? 0 : 2} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.message}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-400">{new Date(item.created_at || item.date).toLocaleDateString()}</p>
                                {item.productId && <p className="text-[10px] text-gray-400 font-mono">Item ID: {item.productId.substring(0, 8)}...</p>}
                            </div>
                        </div>
                    </div>
                ))}

                {feedbackList.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-slate-100 dark:bg-white/50 rounded-xl border border-white/40 border-dashed">
                        <p>No feedback received yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feedback;
