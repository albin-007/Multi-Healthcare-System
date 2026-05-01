import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Activity, UserCircle, Calendar, CheckCircle2, CreditCard as CardIcon, Lock, ChevronLeft, ChevronRight, ShieldCheck, Landmark, Clock, Printer, Download, CheckCircle, FileText, Search, Ban, AlertCircle, Building2, MapPin, Phone, Info, FlaskConical, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { SPECIALIZATION_GROUPS } from '../../data/specializations';
import { jsPDF } from 'jspdf';

import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export default function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state || {};

  const [step, setStep] = useState(prefilled.step || 1);
  const [entityType, setEntityType] = useState(prefilled.entityType || 'DOCTOR'); // DOCTOR or LAB
  const [doctors, setDoctors] = useState([]);
  const [labs, setLabs] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  
  const [selectedEntityId, setSelectedEntityId] = useState(prefilled.doctorId || prefilled.entityId || '');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [date, setDate] = useState(prefilled.date || '');
  const [time, setTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [receiptId, setReceiptId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [temporaryAppointment, setTemporaryAppointment] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [testRequestId, setTestRequestId] = useState(prefilled.testRequestId || null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [labSchedule, setLabSchedule] = useState([]);
  const [labHolidays, setLabHolidays] = useState([]);
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [allLabTests, setAllLabTests] = useState([]);
  const [selectedTestName, setSelectedTestName] = useState('');
  
  // Lab specific booking state
  const [labTests, setLabTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [isHomeCollection, setIsHomeCollection] = useState(false);
  const [labDetails, setLabDetails] = useState(null);
  const [testRequest, setTestRequest] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [doctorsRes, labsRes, clinicsRes, allTestsRes] = await Promise.all([
        api.get('users/doctors/'),
        api.get('users/labs/'),
        api.get('users/clinics/'),
        api.get('users/lab-tests/'),
      ]);
      setDoctors(doctorsRes.data);
      setLabs(labsRes.data);
      setClinics(clinicsRes.data);
      setAllLabTests(allTestsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (prefilled.doctorId && doctors.length > 0) {
      const doc = doctors.find(d => d.id === prefilled.doctorId);
      if (doc && doc.clinic) {
        setSelectedClinicId(doc.clinic.id);
      }
    }
  }, [doctors, prefilled.doctorId]);

  useEffect(() => {
    fetchData();
  }, []);

  const generateLabSlots = (avail) => {
    if (!avail) return [];
    const slots = [];
    const [startH, startM] = avail.start_time.split(':').map(Number);
    const [endH, endM] = avail.end_time.split(':').map(Number);
    const duration = avail.slot_duration || 15;
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      current = new Date(current.getTime() + duration * 60000);
    }
    return slots;
  };

  useEffect(() => {
    if (step === 3 && date && selectedEntityId && entityType === 'DOCTOR') {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const res = await api.get(`appointments/slots/available_slots/?doctor_id=${selectedEntityId}&date=${date}`);
          setAvailableSlots(res.data);
        } catch (err) {
          console.error("Failed to fetch slots", err);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
    
    if (selectedEntityId && entityType === 'LAB') {
      const fetchLabDetails = async () => {
        try {
          // Fetch lab specific availability and holidays
          const [availRes, holidayRes] = await Promise.all([
            api.get(`appointments/lab-availability/?lab_id=${selectedEntityId}`),
            api.get(`appointments/lab-holidays/?lab_id=${selectedEntityId}`)
          ]);
          setLabSchedule(availRes.data);
          setLabHolidays(holidayRes.data);
        } catch (err) {
          console.error("Failed to fetch lab details", err);
        }
      };
      
      const fetchTests = async () => {
        try {
          const res = await api.get(`users/lab-tests/?lab_id=${selectedEntityId}`);
          setLabTests(res.data);
          
          const labRes = await api.get(`users/labs/${selectedEntityId}/`);
          setLabDetails(labRes.data);

          // Handle pre-selected tests from FindTests page
          if (prefilled.selectedTests && Array.isArray(prefilled.selectedTests)) {
            setSelectedTests(prefilled.selectedTests);
          } else if (prefilled.testId) {
            setSelectedTests([prefilled.testId]);
          }
        } catch (err) {
          console.error("Failed to fetch lab tests/details", err);
        }
      };
      fetchLabDetails();
      fetchTests();
    }
  }, [step, date, selectedEntityId, entityType]);

  useEffect(() => {
    if (testRequestId) {
      const fetchTR = async () => {
        try {
          const res = await api.get(`users/test-requests/${testRequestId}/`);
          setTestRequest(res.data);
        } catch (err) {
          console.error("Error fetching test request", err);
        }
      };
      fetchTR();
    }
  }, [testRequestId]);

  useEffect(() => {
    if (testRequest && labTests.length > 0 && entityType === 'LAB' && testRequestId) {
      let prescribedNames = [];
      if (Array.isArray(testRequest.tests)) {
        prescribedNames = testRequest.tests;
      } else if (typeof testRequest.tests === 'string') {
        prescribedNames = testRequest.tests.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      const matchingTests = labTests.filter(lt => 
        prescribedNames.some(name => {
          const n = typeof name === 'string' ? name : (name.name || '');
          if (!n) return false;
          return lt.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(lt.name.toLowerCase());
        })
      );
      
      if (matchingTests.length > 0) {
        setSelectedTests(matchingTests.map(t => t.id));
      }
    }
  }, [testRequest, labTests, entityType, testRequestId]);

  // Clear temporary appointment if details change, ensuring we don't reuse an old one for a new selection
  useEffect(() => {
    setTemporaryAppointment(null);
  }, [selectedEntityId, date, time, selectedSlotId, entityType]);

  const handleSlotSelect = async (slot) => {
    try {
      await api.post(`appointments/slots/${slot.id}/lock/`);
      setSelectedSlotId(slot.id);
      setTime(new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to lock slot. It might have been taken.");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    setIsProcessing(true);
    try {
      let appointment;
      
      if (temporaryAppointment) {
        appointment = temporaryAppointment;
      } else {
        let dateTime;
        if (selectedSlotId) {
          const slot = availableSlots.find(s => s.id === selectedSlotId);
          dateTime = slot.start_time;
        } else {
          dateTime = new Date(`${date}T${time}`).toISOString();
        }
        
        const apptRsp = await api.post('appointments/', {
          entity_type: entityType,
          entity_id: selectedEntityId,
          date: dateTime,
          slot: selectedSlotId,
          payment_mode: paymentMode,
          test_ids: selectedTests,
          is_home_collection: isHomeCollection,
          amount: totalAmount,
          test_request: testRequestId
        });
        appointment = apptRsp.data;
        setTemporaryAppointment(appointment);
      }
      
      if (paymentMode === 'PAY_AT_CLINIC') {
        setBookedAppointment({ 
          ...appointment, 
          is_paid: false, 
          status: entityType === 'LAB' ? 'PENDING' : 'CONFIRMED' 
        });
        setReceiptId(`HC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setStep(4);
        setIsProcessing(false);
        return;
      }

      // 2. Create Razorpay Order
      const { data: order } = await api.post('payments/create-upi-order/', {
        appointment_id: appointment.id
      });

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "careNconnect",
        description: `Payment for ${entityInfo?.name || 'Medical Service'}`,
        order_id: order.order_id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            setIsProcessing(true);
            await api.post('payments/verify-upi-payment/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: appointment.id
            });
            
            setBookedAppointment({ 
              ...appointment, 
              is_paid: true, 
              status: entityType === 'LAB' ? 'PENDING' : 'CONFIRMED' 
            });
            setReceiptId(`HC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
            setStep(4); // Changed from 5 to 4
          } catch (err) {
            const errorMsg = err.response?.data?.error || "Payment verification failed. Please check your transaction.";
            alert(errorMsg);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "Test Patient",
          email: "patient@example.com",
          contact: "9999999999"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
        theme: { color: "#00C9B1" }
      };

      if (order.is_mock) {
        // Automatically trigger success for mock orders in development
        console.log("Mock Order detected. Simulating successful payment...");
        setTimeout(() => {
          options.handler({
            razorpay_order_id: order.order_id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
            razorpay_signature: "mock_signature"
          });
        }, 1500);
      } else {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert('Failed to load Razorpay gateway. Please check your internet connection.');
          setIsProcessing(false);
          return;
        }
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      console.error("Booking Error Details:", err.response?.data || err);
      let errorMsg = 'Please check your connection and try again.';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) {
          errorMsg = data.error;
        } else if (typeof data === 'object') {
          // Flatten field errors: { slot: ["Already booked"] } -> "slot: Already booked"
          errorMsg = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(`Error initiating payment: ${errorMsg}`);
      setIsProcessing(false);
    }
  };

  const entityInfo = (() => {
    if (!selectedEntityId) return null;
    if (entityType === 'DOCTOR') {
      const doc = doctors.find(d => d.id === selectedEntityId);
      return doc ? { 
        name: doc.name, 
        sub: doc.specialty, 
        fee: parseFloat(doc.clinic?.consultation_fee) || 150.00,
        advance_payment: parseFloat(doc.clinic?.advance_payment) || null,
        payment_type: doc.clinic?.payment_type || 'BOTH',
        clinic: doc.clinic 
      } : null;
    } else {
      const lab = labs.find(l => l.id === selectedEntityId);
      return lab ? { 
        name: lab.name, 
        sub: lab.address, 
        fee: 0.00,
        advance_payment: parseFloat(lab.advance_payment) || null,
        payment_type: lab.payment_type || 'BOTH',
        home_collection_charge: parseFloat(lab.home_collection_charge) || 0,
        home_collection_available: lab.home_collection_available
      } : null;
    }
  })();

  const testsPrice = labTests
    .filter(t => selectedTests.some(id => String(id) === String(t.id)))
    .reduce((sum, t) => sum + parseFloat(t.price), 0);
  
  const homeCollectionCharge = isHomeCollection ? (entityInfo?.home_collection_charge || 0) : 0;
  const processingFee = paymentMode === 'ONLINE' ? 2.00 : 0.00;
  const totalAmount = (entityType === 'DOCTOR' ? (entityInfo?.fee || 0) : 0) + testsPrice + homeCollectionCharge + processingFee;

  useEffect(() => {
    if (entityInfo) {
      if (entityInfo.payment_type === 'PAY_AT_CLINIC') setPaymentMode('PAY_AT_CLINIC');
      else setPaymentMode('ONLINE');
    }
  }, [selectedEntityId, entityInfo?.payment_type]);

  const handleDownloadPDF = () => {
    if (!bookedAppointment || !entityInfo) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(0, 201, 177); // brand-500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("careNconnect", 20, 25);
    
    doc.setFontSize(10);
    doc.text("Official Booking Receipt", 20, 32);
    
    // Receipt Details
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let y = 60;
    
    const addField = (label, value) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 70, y);
      y += 10;
    };

    addField("Appointment ID", `#${bookedAppointment.id}`);
    addField("Receipt ID", receiptId);
    
    // Fix: Only show "PAID" if actually paid
    const statusText = bookedAppointment.is_paid ? "CONFIRMED & PAID" : "CONFIRMED (PAY AT FACILITY)";
    addField("Status", statusText);
    
    addField("Token Number", bookedAppointment.token || "N/A");
    
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 5, pageWidth - 20, y - 5);
    
    addField("Service Type", entityType === 'DOCTOR' ? 'Consultation' : 'Diagnostic Lab');
    addField(entityType === 'DOCTOR' ? 'Doctor Name' : 'Laboratory', entityInfo.name);
    addField("Schedule", `${date} at ${time}`);
    
    if (entityType === 'DOCTOR' && entityInfo.clinic) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Clinic Details:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.text(entityInfo.clinic.name, 25, y);
      y += 5;
      doc.text(entityInfo.clinic.address || "No address provided", 25, y);
      y += 10;
    } else if (entityType === 'LAB') {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Lab Address:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.text(entityInfo.sub || "No address provided", 25, y);
      y += 10;
    }

    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 5, pageWidth - 20, y - 5);
    
    if (entityType === 'DOCTOR') {
      addField("Consultation Fee", `INR ${entityInfo.fee.toFixed(2)}`);
    }
    
    // Fix: Add test names to receipt
    if (selectedTests.length > 0) {
      const testNames = labTests
        .filter(t => selectedTests.some(id => String(id) === String(t.id)))
        .map(t => t.name)
        .join(", ");
      
      // Use splitTextToSize to wrap long test lists
      const wrappedTestNames = doc.splitTextToSize(testNames, 120);
      doc.setFont("helvetica", "bold");
      doc.text("Selected Tests:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(wrappedTestNames, 70, y);
      y += (wrappedTestNames.length * 7);
      
      addField("Tests Subtotal", `INR ${testsPrice.toFixed(2)}`);
    }
    
    if (isHomeCollection) {
      addField("Home Collection", `INR ${homeCollectionCharge.toFixed(2)}`);
    }
    
    if (paymentMode === 'ONLINE') {
      addField("Processing Fee", "INR 2.00");
    }

    if (entityInfo.advance_payment && paymentMode === 'ONLINE') {
      addField("Advance Paid", `INR ${entityInfo.advance_payment.toFixed(2)}`);
      addField("Due at Facility", `INR ${(totalAmount - entityInfo.advance_payment).toFixed(2)}`);
    } else if (paymentMode === 'PAY_AT_CLINIC') {
      addField("Due at Facility", `INR ${totalAmount.toFixed(2)}`);
    }
    
    y += 5;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    
    // Fix: Logic for "Amount Paid"
    if (bookedAppointment.is_paid) {
      doc.setTextColor(0, 201, 177);
      doc.text("Amount Paid:", 20, y + 5);
      const totalPaidValue = paymentMode === 'PAY_AT_CLINIC' ? 0 : (entityInfo.advance_payment ? entityInfo.advance_payment + 2 : totalAmount + 2);
      doc.text(`INR ${totalPaidValue.toFixed(2)}`, 70, y + 5);
    } else {
      doc.setTextColor(255, 107, 107); // rose-500
      doc.text("Amount Due:", 20, y + 5);
      doc.text(`INR ${totalAmount.toFixed(2)}`, 70, y + 5);
    }
    
    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is an electronically generated receipt and does not require a physical signature.", pageWidth / 2, 280, { align: "center" });
    doc.text("Thank you for choosing careNconnect for your healthcare needs.", pageWidth / 2, 285, { align: "center" });
    
    doc.save(`Receipt-${receiptId}.pdf`);
  };

  const formatCardNumber = (val) => { return val; }; // Placeholder keeping it to avoid any logic breaks if referenced elsewhere

  if (isLoading) return (
    <div className="flex h-[600px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="h-12 w-12 text-brand-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Medical Network...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Dynamic Stepper Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <Badge className="bg-brand-50 text-brand-600 border-brand-100 px-3 py-1 mb-2">Checkout Process</Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Confirm Booking</h1>
          <p className="text-slate-500 max-w-sm">Secure your slot with our healthcare specialists in four easy steps.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-500 shadow-sm ${step === s ? 'bg-brand-500 text-white scale-110 shadow-brand-500/20' : step > s ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5 text-glow" /> : s}
                {step === s && <div className="absolute -bottom-1 w-1/2 h-1 bg-white/30 rounded-full"></div>}
              </div>
              {s < 4 && <div className={`h-0.5 w-6 sm:w-10 transition-colors duration-500 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <Card className="glass-card rounded-[2.5rem] border-0 overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Step 1: Type Selection */}
            {step === 1 && (
              <div className="p-10 space-y-10 animate-in slide-in-from-right-10 duration-500 h-full flex flex-col">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">What service do you need?</h2>
                  <p className="text-slate-400">Select between direct doctor consultation or laboratory diagnostics.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
                  <button 
                    onClick={() => setEntityType('DOCTOR')}
                    className={`group relative overflow-hidden p-8 rounded-[2rem] border-4 transition-all duration-300 text-left h-full ${entityType === 'DOCTOR' ? 'border-brand-500 bg-brand-50/50 shadow-2xl shadow-brand-500/10' : 'border-slate-100 hover:border-brand-200 bg-white'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${entityType === 'DOCTOR' ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-500'}`}>
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Doctor</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Schedule a private session with leading specialists and general practitioners.</p>
                  </button>

                  <button 
                    onClick={() => setEntityType('LAB')}
                    className={`group relative overflow-hidden p-8 rounded-[2rem] border-4 transition-all duration-300 text-left h-full ${entityType === 'LAB' ? 'border-brand-500 bg-brand-50/50 shadow-2xl shadow-brand-500/10' : 'border-slate-100 hover:border-brand-200 bg-white'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${entityType === 'LAB' ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-500'}`}>
                      <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Diagnostics</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Book blood tests, imaging, and advanced diagnostic screenings near you.</p>
                  </button>
                </div>

                <div className="pt-8 flex justify-end">
                  <Button size="lg" className="px-12 py-8 rounded-2xl font-black text-lg shadow-xl shadow-brand-500/20" onClick={() => { setSelectedEntityId(''); setStep(2); }}>
                    Proceed to Selection <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Provider Selection / Clinic Profile */}
            {step === 2 && (
              <div className="p-10 space-y-8 animate-in slide-in-from-right-10 duration-500 h-full flex flex-col">
                {entityType === 'DOCTOR' && selectedEntityId && selectedClinicId ? (
                  <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="grid md:grid-cols-3 gap-10 items-start">
                       <div className="md:col-span-1">
                          <img 
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${clinics.find(c => c.id === selectedClinicId)?.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-full aspect-square rounded-[3rem] border-4 border-white shadow-2xl shadow-brand-500/10 object-cover" 
                            alt="Clinic" 
                          />
                       </div>
                       <div className="md:col-span-2 space-y-6 text-left">
                          <div>
                             <Badge className="bg-brand-50 text-brand-600 border-0 uppercase text-[10px] font-black tracking-widest px-3 py-1 mb-3">Clinical Workspace</Badge>
                             <h2 className="text-4xl font-black text-slate-900 leading-tight text-left">
                                {clinics.find(c => c.id === selectedClinicId)?.name || 'Healthcare Facility'}
                             </h2>
                             <p className="text-slate-400 font-bold mt-2 italic text-left">Operating as the primary treatment center for Dr. {doctors.find(d => d.id === selectedEntityId)?.name}.</p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                             <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm"><MapPin className="w-6 h-6" /></div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Location</p>
                                   <p className="font-bold text-slate-900 text-sm">{clinics.find(c => c.id === selectedClinicId)?.address || 'Address Verified'}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm"><Phone className="w-6 h-6" /></div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Medical Desk</p>
                                   <p className="font-bold text-slate-900 text-sm text-left">+91 82813 46911</p>
                                </div>
                             </div>
                          </div>

                          <div className="p-6 rounded-[2rem] bg-brand-500 text-white flex items-start gap-5 shadow-xl shadow-brand-500/20">
                             <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                               <Info className="w-6 h-6 text-white" />
                             </div>
                             <div>
                                <p className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-80 text-left">Patient Instruction</p>
                                <p className="text-sm font-bold leading-relaxed text-left">
                                   Please arrive 10 minutes before your scheduled slot. Our facility supports digital payments and eco-friendly report transmission.
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 flex justify-between items-center border-t border-slate-100 mt-auto">
                      <Button variant="ghost" size="lg" className="rounded-2xl font-bold text-slate-400" onClick={() => { setSelectedClinicId(''); setSelectedEntityId(''); }}>
                        <ChevronLeft className="mr-2 w-5 h-5" /> Back to Selection
                      </Button>
                      <Button size="lg" className="px-12 py-8 rounded-2xl font-black text-lg bg-brand-500 text-white shadow-xl shadow-brand-500/20 hover:scale-105 transition-all text-left" onClick={() => setStep(3)}>
                        Proceed to Time Selection <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900">
                      {entityType === 'DOCTOR' 
                        ? (!selectedClinicId ? 'Select Clinical Facility' : 'Choose Specialist')
                        : (!selectedTestName ? 'Select Diagnostic Test' : `Choose Lab for ${selectedTestName}`)}
                    </h2>
                    <p className="text-slate-400">
                      {entityType === 'DOCTOR' 
                        ? (!selectedClinicId ? 'Browsing multi-specialty verified clinics.' : `Viewing doctors at ${clinics.find(c => c.id === selectedClinicId)?.name || 'the clinic'}.`)
                        : (!selectedTestName ? 'Browse all available diagnostic tests in our network.' : `Comparing pricing for ${selectedTestName} across verified laboratories.`)}
                    </p>
                  </div>
                  {((entityType === 'DOCTOR' && selectedClinicId) || (entityType === 'LAB' && selectedTestName)) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { 
                        if (entityType === 'DOCTOR') {
                          setSelectedClinicId(''); 
                        } else {
                          setSelectedTestName('');
                        }
                        setSelectedEntityId(''); 
                      }}
                      className="text-brand-600 font-bold hover:bg-brand-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> {entityType === 'DOCTOR' ? 'Change Clinic' : 'Change Test'}
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                   <div className="relative flex-[1.5]">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                       type="text"
                       placeholder={entityType === 'DOCTOR' 
                         ? (!selectedClinicId ? 'Search clinics by name...' : 'Search doctor name...')
                        : (!selectedTestName ? 'Search for specific tests...' : 'Search for lab name...')}
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500"
                     />
                   </div>
                   
                   {entityType === 'DOCTOR' && !selectedClinicId && (
                     <div className="relative flex-1">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input
                         type="text"
                         placeholder="Search by location..."
                         value={locationSearch}
                         onChange={e => setLocationSearch(e.target.value)}
                         className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500"
                       />
                     </div>
                   )}

                   {entityType === 'DOCTOR' && selectedClinicId && (
                     <select
                       value={specialtyFilter}
                       onChange={e => setSpecialtyFilter(e.target.value)}
                       className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 min-w-[180px]"
                     >
                       <option value="">All Specialties</option>
                       {SPECIALIZATION_GROUPS.map(group => (
                         <optgroup key={group.group} label={group.group}>
                           {group.options.map(opt => (
                             <option key={opt} value={opt}>{opt}</option>
                           ))}
                         </optgroup>
                       ))}
                     </select>
                   )}
                </div>

                <div className="grid gap-4 overflow-y-auto max-h-[400px] p-1 flex-1">
                  {entityType === 'DOCTOR' && !selectedClinicId && (
                    clinics
                      .filter(c => c.admin_user?.status === 'APPROVED')
                      .filter(c => 
                        (!searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                        (!locationSearch || (c.address || '').toLowerCase().includes(locationSearch.toLowerCase()))
                      )
                      .map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { setSelectedClinicId(c.id); setSearchQuery(''); }}
                          className="group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5 border-slate-100 bg-white hover:border-brand-200 hover:shadow-md"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center border-2 border-white shadow-lg shadow-brand-500/10">
                            <Building2 className="w-8 h-8 text-brand-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {c.name}
                              <ShieldCheck className="w-4 h-4 text-brand-500" />
                            </h4>
                            <p className="text-sm text-slate-500 mt-0.5 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {c.address} • Verified Network
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center transition-all">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        </div>
                      ))
                  )}

                  {entityType === 'DOCTOR' && selectedClinicId && (
                    doctors
                      .filter(d => d.clinic?.id === selectedClinicId)
                      .filter(d => 
                        (!searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                        (!specialtyFilter || d.specialty === specialtyFilter)
                      )
                      .map(d => (
                        <div 
                          key={d.id} 
                          onClick={() => setSelectedEntityId(d.id)}
                          className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5 ${selectedEntityId === d.id ? 'border-brand-500 bg-brand-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg shadow-brand-500/10 object-cover" 
                            alt={d.name} 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {d.name}
                              {selectedEntityId === d.id && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                            </h4>
                            <p className="text-sm text-slate-500 mt-0.5 truncate uppercase tracking-widest text-[10px] font-black">{d.specialty} • ₹150</p>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedEntityId === d.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-brand-300'}`}>
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        </div>
                      ))
                  )}

                  {entityType === 'LAB' && !selectedTestName && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {searchQuery ? (
                        Array.from(new Set(allLabTests.filter(t => labs.some(l => String(l.id) === String(t.lab) && l.admin_user?.status === 'APPROVED')).map(t => t.name)))
                          .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(testName => {
                            const minPrice = Math.min(...allLabTests.filter(t => t.name === testName && labs.some(l => String(l.id) === String(t.lab) && l.admin_user?.status === 'APPROVED')).map(t => t.price));
                            return (
                              <div 
                                key={testName}
                                onClick={() => { setSelectedTestName(testName); setSearchQuery(''); }}
                                className="group p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-brand-200 transition-all cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                    <FlaskConical size={24} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900">{testName}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Starting at ₹{minPrice}</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500" />
                              </div>
                            );
                          })
                      ) : (
                        <div className="col-span-full py-12 text-center border border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                          <Search className="w-8 h-8 text-slate-200 mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start typing to search for diagnostic tests...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {entityType === 'LAB' && selectedTestName && (
                    labs
                      .filter(l => l.admin_user?.status === 'APPROVED')
                      .filter(l => allLabTests.some(t => t.name === selectedTestName && String(t.lab) === String(l.id)))
                      .filter(l => !searchQuery || (l.name || l.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(l => {
                        const testOffer = allLabTests.find(t => t.name === selectedTestName && String(t.lab) === String(l.id));
                        return (
                          <div 
                            key={l.id} 
                            onClick={() => setSelectedEntityId(l.id)}
                            className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5 ${selectedEntityId === l.id ? 'border-brand-500 bg-brand-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                          >
                            <img 
                              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${l.name || l.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                              className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg shadow-brand-500/10" 
                              alt={l.name || l.username} 
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                {l.name || l.username}
                                {selectedEntityId === l.id && <ShieldCheck className="w-4 h-4 text-brand-500" />}
                              </h4>
                              <p className="text-sm text-slate-500 mt-0.5 truncate">{l.address} • Verified Facility</p>
                              <p className="text-sm font-black text-brand-600 mt-1">₹{testOffer?.price || 0}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedEntityId === l.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-brand-300'}`}>
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                    <div className="pt-8 flex justify-between">
                      <Button variant="ghost" size="lg" className="rounded-2xl font-bold" onClick={() => setStep(1)}>
                        <ChevronLeft className="mr-2 w-5 h-5" /> Back
                      </Button>
                      <Button size="lg" className="px-12 py-8 rounded-2xl font-black text-lg shadow-xl shadow-brand-500/20" disabled={!selectedEntityId} onClick={() => {
                        // Ensure the selected test is in the selectedTests array if it was chosen in Step 2
                        if (entityType === 'LAB' && selectedTestName) {
                          const testOffer = allLabTests.find(t => t.name === selectedTestName && t.lab === selectedEntityId);
                          if (testOffer && !selectedTests.includes(testOffer.id)) {
                            setSelectedTests([testOffer.id]);
                          }
                        }
                        setStep(3);
                      }}>
                        Select Date & Time <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Schedule & Payment */}
            {step === 3 && (
              <div className="p-10 space-y-10 animate-in slide-in-from-right-10 duration-500 h-full flex flex-col items-center">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">Schedule your visit</h2>
                  <p className="text-slate-400">Pick a convenient time for your consultation with {entityInfo?.name}.</p>
                </div>

                <div className="w-full space-y-8 flex-1">
                  {/* Date Selection */}
                  <div 
                    onClick={() => document.getElementById('date-picker').showPicker?.()} 
                    className={`relative p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer ${date ? 'border-brand-500 bg-brand-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-brand-200'}`}
                  >
                    <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 mb-4 block">1. Select Appointment Date</Label>
                    <div className="relative">
                      <Calendar className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${date ? 'text-brand-500' : 'text-slate-400'}`} />
                      <Input 
                        id="date-picker"
                        type="date" 
                        value={date} 
                        onChange={e => { setDate(e.target.value); setSelectedSlotId(null); setTime(''); }} 
                        className="h-14 pl-10 border-0 bg-transparent font-black text-xl focus-visible:ring-0 w-full cursor-pointer"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {/* Slot Selection for Doctors */}
                  {entityType === 'DOCTOR' && date && (
                    <div className="space-y-4">
                      <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 block px-4">2. Available Time Slots</Label>
                      {loadingSlots ? (
                        <div className="flex justify-center p-12">
                          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                           <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                           <p className="text-slate-400 font-bold">No slots available for this date.</p>
                           <p className="text-xs text-slate-300 mt-1">Try selecting another date or provider.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                          {availableSlots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotSelect(slot)}
                              className={`p-3 rounded-2xl border-2 font-black text-sm transition-all duration-300 ${selectedSlotId === slot.id ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105' : 'border-slate-100 bg-white hover:border-brand-200 text-slate-600'}`}
                            >
                              {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Simple Time Picker for LAB (if not using slots for labs yet) */}
                  {entityType === 'LAB' && date && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 w-full">
                      
                      {/* 1.5 Select Tests (New Section) */}
                      <div className="space-y-4">
                        <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 block px-4">1. Selected Diagnostic Tests</Label>
                        <div className="grid gap-3">
                          {labTests.filter(t => selectedTests.some(id => String(id) === String(t.id))).map(test => (
                            <div key={test.id} className="flex justify-between items-center p-5 bg-white border-2 border-slate-50 rounded-3xl hover:border-brand-100 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                                  <FlaskConical size={20} />
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm text-left">{test.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase text-left">{test.category || 'General'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <p className="font-black text-brand-600">₹{test.price}</p>
                                  {!testRequestId && (
                                    <button 
                                      onClick={() => setSelectedTests(prev => prev.filter(id => String(id) !== String(test.id)))}
                                      className="p-2 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                      title="Remove Test"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Add More Tests Dropdown */}
                            {!testRequestId && (
                              <div className="relative mt-2">
                                <select 
                                  className="w-full p-4 pr-12 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-bold text-sm focus:outline-none focus:border-brand-200 focus:text-brand-600 transition-all appearance-none cursor-pointer hover:bg-white"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !selectedTests.some(id => String(id) === String(val))) {
                                      setSelectedTests(prev => [...prev, val]);
                                    }
                                    e.target.value = "";
                                  }}
                                >
                                  <option value="">+ Add another test from this lab...</option>
                                  {labTests.filter(t => !selectedTests.some(id => String(id) === String(t.id))).map(test => (
                                    <option key={test.id} value={test.id}>{test.name} - ₹{test.price}</option>
                                  ))}
                                </select>
                                <Plus className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                              </div>
                            )}
                          </div>
                          {testRequestId && (
                            <div className="space-y-3 mt-4">
                              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                                <Info className="w-5 h-5 text-blue-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">These tests are prescribed by your doctor and cannot be modified.</p>
                              </div>
                              
                              {testRequest && labTests.length > 0 && (() => {
                                let prescribedNames = [];
                                if (Array.isArray(testRequest.tests)) {
                                  prescribedNames = testRequest.tests;
                                } else if (typeof testRequest.tests === 'string') {
                                  prescribedNames = testRequest.tests.split(',').map(s => s.trim()).filter(Boolean);
                                }
                                
                                const missing = prescribedNames.filter(name => {
                                  const n = typeof name === 'string' ? name : (name.name || '');
                                  if (!n) return false;
                                  return !labTests.some(lt => lt.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(lt.name.toLowerCase()));
                                });
                                if (missing.length > 0) {
                                  return (
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                                      <AlertCircle className="w-5 h-5 text-amber-500" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Warning: {missing.join(', ')} are not available at this lab.</p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        {selectedTests.length === 0 && (
                          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest px-4 mt-2">At least one test must be selected</p>
                        )}
                      </div>
                      
                      {/* 2. Visit Type Selection */}
                      {entityInfo?.home_collection_available && (
                        <div className="space-y-4">
                          <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 block px-4">2. Choose Visit Type</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Option: Lab Visit */}
                            <div 
                              onClick={() => setIsHomeCollection(false)}
                              className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${!isHomeCollection ? 'border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10' : 'border-slate-100 bg-white hover:border-brand-200'}`}
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${!isHomeCollection ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'}`}>
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <p className="font-black text-slate-900 text-sm">Lab Visit</p>
                                <p className="text-[10px] text-slate-400 font-bold">Visit our facility</p>
                              </div>
                              {!isHomeCollection && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                            </div>

                            {/* Option: Home Collection */}
                            <div 
                              onClick={() => setIsHomeCollection(true)}
                              className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${isHomeCollection ? 'border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10' : 'border-slate-100 bg-white hover:border-brand-200'}`}
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isHomeCollection ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'}`}>
                                <MapPin className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <p className="font-black text-slate-900 text-sm">Home Collection</p>
                                <p className="text-[10px] text-slate-400 font-bold">Technician visits you</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-brand-600">+₹{entityInfo.home_collection_charge}</p>
                                {isHomeCollection && <CheckCircle2 className="w-5 h-5 text-brand-500 ml-auto mt-1" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Time Selection (Renumbered) */}
                      {/* Holiday Warning */}
                      {labHolidays.some(h => h.date === date) && (
                        <div className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center gap-4 text-rose-600 animate-pulse">
                          <Ban className="w-8 h-8" />
                          <div>
                            <p className="font-black text-sm uppercase tracking-wider">Center Closure Detected</p>
                            <p className="text-xs font-bold opacity-80">{labHolidays.find(h => h.date === date).reason || 'The lab is closed on this date.'}</p>
                          </div>
                        </div>
                      )}

                      {/* Not Working Day Warning */}
                      {!labHolidays.some(h => h.date === date) && !labSchedule.some(s => {
                        const [y, m, d] = date.split('-').map(Number);
                        const dayOfWeek = (new Date(y, m - 1, d).getDay() + 6) % 7;
                        return String(s.day_of_week) === String(dayOfWeek);
                      }) && (
                        <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center gap-4 text-amber-600">
                          <AlertCircle className="w-8 h-8" />
                          <div>
                            <p className="font-black text-sm uppercase tracking-wider">Outside Working Days</p>
                            <p className="text-xs font-bold opacity-80">This lab is usually closed on this day of the week.</p>
                          </div>
                        </div>
                      )}

                      {/* Slot Selection for LAB */}
                      {date && !labHolidays.some(h => h.date === date) && (
                        <div className="space-y-4">
                          <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 block px-4">3. Select Visit Time Slot</Label>
                          {(() => {
                             const [y, m, d] = date.split('-').map(Number);
                             const dayOfWeek = (new Date(y, m - 1, d).getDay() + 6) % 7;
                             const dayAvail = labSchedule.find(s => String(s.day_of_week) === String(dayOfWeek));
                             const slots = generateLabSlots(dayAvail);

                            if (slots.length === 0) {
                              return (
                                <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                   <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                   <p className="text-slate-400 font-bold text-xs">No slots available for this day's schedule.</p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                                {slots.map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setTime(s)}
                                    className={`p-3 rounded-2xl border-2 font-black text-xs transition-all duration-300 ${time === s ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105' : 'border-slate-100 bg-white hover:border-brand-200 text-slate-600'}`}
                                  >
                                    {new Date(`2000-01-01T${s}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Lab Schedule View for Patient */}
                      <div className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Lab Working Hours</h4>
                           <Activity className="w-4 h-4 text-brand-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {labSchedule.length > 0 ? labSchedule.sort((a,b) => a.day_of_week - b.day_of_week).map(s => (
                             <div key={s.id} className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">{s.day_display}</span>
                                <span className="text-sm font-bold">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</span>
                             </div>
                           )) : (
                             <p className="col-span-2 text-xs font-bold text-slate-500">Regular hours: Mon-Fri 09:00 - 17:00</p>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Mode Selection */}
                  {date && time && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500 bg-white border border-slate-100 p-8 rounded-[2rem]">
                      <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-slate-400 block mb-4">4. Payment Preference</Label>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {(entityInfo?.payment_type === 'BOTH' || entityInfo?.payment_type === 'ONLINE') && (
                          <div 
                            onClick={() => setPaymentMode('ONLINE')}
                            className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all ${paymentMode === 'ONLINE' ? 'border-brand-500 bg-brand-50/50 shadow-md' : 'border-slate-100 hover:border-brand-200'}`}
                          >
                            <div className="flex items-center gap-4 mb-2">
                              <CardIcon className={`w-6 h-6 ${paymentMode === 'ONLINE' ? 'text-brand-500' : 'text-slate-400'}`} />
                              <span className="font-bold text-slate-900">Pay Online Now</span>
                            </div>
                            <p className="text-xs text-slate-500 ml-10">Secure online payment. {entityInfo?.advance_payment ? `(Advance: ₹${entityInfo.advance_payment})` : ''}</p>
                          </div>
                        )}
                        {(entityInfo?.payment_type === 'BOTH' || entityInfo?.payment_type === 'PAY_AT_CLINIC') && (
                          <div 
                            onClick={() => setPaymentMode('PAY_AT_CLINIC')}
                            className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all ${paymentMode === 'PAY_AT_CLINIC' ? 'border-brand-500 bg-brand-50/50 shadow-md' : 'border-slate-100 hover:border-brand-200'}`}
                          >
                            <div className="flex items-center gap-4 mb-2">
                              <Building2 className={`w-6 h-6 ${paymentMode === 'PAY_AT_CLINIC' ? 'text-brand-500' : 'text-slate-400'}`} />
                              <span className="font-bold text-slate-900">Pay at {entityType === 'DOCTOR' ? 'Clinic' : 'Lab'}</span>
                            </div>
                            <p className="text-xs text-slate-500 ml-10">Pay when you visit the facility.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-8 w-full flex justify-between mt-auto">
                  <Button variant="ghost" size="lg" className="rounded-2xl font-bold hover:bg-slate-100" onClick={() => setStep(2)}>
                    <ChevronLeft className="mr-2 w-5 h-5" /> Back
                  </Button>
                  <Button 
                    size="lg" 
                    className={`px-12 py-8 rounded-2xl font-black text-lg transition-all duration-500 ${(!date || !time || isProcessing || (entityType === 'LAB' && selectedTests.length === 0)) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-brand-500 text-white shadow-xl shadow-brand-500/20 hover:scale-105 active:scale-95'}`} 
                    disabled={!date || !time || isProcessing || (entityType === 'LAB' && selectedTests.length === 0)} 
                    onClick={handleBooking}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-4">
                        <div className="h-6 w-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                         Confirm & Pay Now <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Professional Receipt (formerly Step 5) */}
            {step === 4 && (
              <div className="p-10 space-y-8 animate-in zoom-in-95 duration-700 h-full flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 rounded-full scale-150 animate-pulse"></div>
                  <div className="relative h-24 w-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-in zoom-in spin-in-12 duration-1000">
                    <CheckCircle className="w-14 h-14" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">
                    {entityType === 'LAB' ? 'Booking Requested!' : 'Booking Confirmed!'}
                  </h2>
                  <p className="text-slate-400">
                    {entityType === 'LAB' 
                      ? 'Your request has been sent to the lab. They will review and schedule your test shortly.' 
                      : 'Your appointment is secured and a receipt has been generated.'}
                  </p>
                </div>

                <div className="w-full max-w-md relative">
                  {/* Receipt Card */}
                  <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    {/* Top Notch/Punch holes effect */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                       {[...Array(6)].map((_, i) => <div key={i} className="w-6 h-6 rounded-full bg-slate-900 border-4 border-white"></div>)}
                    </div>
                    
                    <div className="p-10 pt-12 space-y-8">
                       <div className="flex justify-between items-start">
                         <div className="space-y-1">
                           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt Number</div>
                           <div className="font-mono font-bold text-slate-900">{receiptId}</div>
                         </div>
                         <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">Paid</div>
                       </div>

                       {bookedAppointment?.token && (
                         <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-1">Queue Token</p>
                            <p className="text-3xl font-black text-brand-700">{bookedAppointment.token}</p>
                         </div>
                       )}

                       <div className="space-y-6">
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-400 font-bold uppercase tracking-wider">Service Type</span>
                           <span className="text-slate-900 font-black">{entityType === 'DOCTOR' ? 'Consultation' : 'Diagnostic Lab'}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-400 font-bold uppercase tracking-wider">Provider</span>
                           <span className="text-slate-900 font-black">{entityInfo?.name}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-slate-400 font-bold uppercase tracking-wider">Schedule</span>
                           <span className="text-slate-900 font-black">{date} • {time}</span>
                         </div>
                         <div className="pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                          <span className="text-slate-400 font-black uppercase tracking-widest">Amount Paid</span>
                          <span className="text-3xl font-black text-brand-600">₹{paymentMode === 'PAY_AT_CLINIC' ? '0.00' : (entityInfo?.advance_payment ? (entityInfo.advance_payment + 2).toFixed(2) : (totalAmount + 2).toFixed(2))}</span>
                       </div>
                       </div>

                       <div className="pt-4 flex justify-center opacity-10">
                          <FileText className="w-20 h-20 text-slate-900 rotate-12" />
                       </div>
                    </div>
                  </div>

                  {/* Stamp Overlay */}
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full border-4 border-emerald-500/30 flex items-center justify-center rotate-12 backdrop-blur-sm">
                     <div className="text-emerald-500 font-black text-sm uppercase tracking-tighter text-center">
                       Verified<br/>Payment
                     </div>
                  </div>
                </div>

                <div className="w-full pt-10 grid grid-cols-3 gap-4">
                  <Button variant="outline" className="rounded-2xl py-6 font-bold flex flex-col gap-1 h-auto border-slate-200 hover:bg-slate-50">
                    <Printer className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">Print</span>
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="outline" className="rounded-2xl py-6 font-bold flex flex-col gap-1 h-auto border-slate-200 hover:bg-slate-50 transition-all hover:border-brand-500 hover:text-brand-500">
                    <Download className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">PDF</span>
                  </Button>
                  <Button onClick={() => navigate('/patient')} className="rounded-2xl py-6 font-black text-white bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-500/20 col-span-1 h-auto">
                    Done
                  </Button>
                </div>
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <div className="lg:col-span-4 sticky top-10">
          <Card className="glass-card rounded-[2.5rem] border-0 overflow-hidden">
            <div className="p-8 space-y-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-emerald-500 w-6 h-6" /> Order Summary
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
                    <UserCircle className="w-7 h-7 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Recipient</p>
                    <p className="font-bold text-slate-900">{entityInfo?.name || '---'}</p>
                    <p className="text-sm text-slate-500 italic mt-0.5">{entityInfo?.sub || '---'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Date & Slot</p>
                    <p className="font-bold text-slate-900">{date || '---'}</p>
                    <p className="text-sm text-slate-500 italic mt-0.5">{time || '---'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                {entityType === 'DOCTOR' && (
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 tracking-wide uppercase">Consultation Fee</span>
                    <span className="text-slate-900">₹{entityInfo?.fee?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {(selectedTests.length > 0 || testsPrice > 0) && (
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 tracking-wide uppercase">Tests {selectedTests.length > 0 ? `(${selectedTests.length})` : ''}</span>
                    <span className="text-slate-900">₹{testsPrice.toFixed(2)}</span>
                  </div>
                )}
                {isHomeCollection && (
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 tracking-wide uppercase">Home Collection</span>
                    <span className="text-slate-900">₹{homeCollectionCharge.toFixed(2)}</span>
                  </div>
                )}
                {paymentMode === 'ONLINE' && (
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 tracking-wide uppercase">Processing Fee</span>
                    <span className="text-slate-900">₹2.00</span>
                  </div>
                )}
                {paymentMode === 'ONLINE' && entityInfo?.advance_payment && (
                  <div className="flex justify-between items-center text-sm font-bold text-brand-600">
                    <span className="tracking-wide uppercase">Advance Required</span>
                    <span>₹{entityInfo.advance_payment.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 border-dashed">
                  <span className="text-lg font-black text-slate-900 uppercase">To Pay Now</span>
                  <span className="text-3xl font-black text-brand-600 tracking-tighter">
                    ₹{paymentMode === 'PAY_AT_CLINIC' ? '0.00' : (entityInfo?.advance_payment ? (entityInfo.advance_payment + 2).toFixed(2) : totalAmount.toFixed(2))}
                  </span>
                </div>
                {paymentMode === 'PAY_AT_CLINIC' && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Due at Facility</span>
                    <span className="text-sm font-black text-slate-900">₹{totalAmount.toFixed(2)}</span>
                  </div>
                )}
                {paymentMode === 'ONLINE' && entityInfo?.advance_payment && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Due at Facility</span>
                    <span className="text-sm font-black text-slate-900">₹{(totalAmount - entityInfo.advance_payment).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strictly HIPAA Compliant Checkout</span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
