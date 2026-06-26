"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp, 
  query, 
  orderBy, 
  runTransaction,
  onSnapshot
} from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SERVICES_LIST } from "@/lib/services";
import { calculateRankingScore, getWorkerActivityStatus, WorkerMetrics } from "@/lib/ranking";
import ServiceIcon from "@/components/ServiceIcon";
import { promiseWithTimeout, compressImageToBase64 } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Star, 
  DollarSign, 
  AlertTriangle, 
  History, 
  LogOut, 
  Plus, 
  UserPlus, 
  Slash, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  MapPin,
  ClipboardList
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "workers" | "complaints" | "reviews" | "revenue" | "logs" | "services">("overview");

  // Data State
  const [leads, setLeads] = useState<any[]>([]);
  const [workers, setWorkers] = useState<WorkerMetrics[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Services State
  const [services, setServices] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Service Form State
  const [serviceIdInput, setServiceIdInput] = useState("");
  const [serviceNameInput, setServiceNameInput] = useState("");
  const [serviceAssuranceFeeInput, setServiceAssuranceFeeInput] = useState("");
  const [serviceIconNameInput, setServiceIconNameInput] = useState("");
  const [serviceImageUrlInput, setServiceImageUrlInput] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [serviceDescriptionInput, setServiceDescriptionInput] = useState("");
  const [serviceShortDescInput, setServiceShortDescInput] = useState("");
  const [serviceBenefitsInput, setServiceBenefitsInput] = useState("");
  const [serviceSubServicesInput, setServiceSubServicesInput] = useState("");
  const [serviceFaqs, setServiceFaqs] = useState<{ question: string; answer: string }[]>([
    { question: "", answer: "" }
  ]);

  // Forms / Actions State
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddComplaint, setShowAddComplaint] = useState(false);

  // Add Worker Form State
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerMobile, setNewWorkerMobile] = useState("");
  const [newWorkerService, setNewWorkerService] = useState("");
  const [newWorkerArea, setNewWorkerArea] = useState("");
  const [newWorkerExp, setNewWorkerExp] = useState("");

  // Add Complaint Form State
  const [complaintWorkerId, setComplaintWorkerId] = useState("");
  const [complaintBookingId, setComplaintBookingId] = useState("");
  const [complaintNotes, setComplaintNotes] = useState("");

  // Edit Worker Form State
  const [editingWorker, setEditingWorker] = useState<WorkerMetrics | null>(null);
  const [editWorkerName, setEditWorkerName] = useState("");
  const [editWorkerMobile, setEditWorkerMobile] = useState("");
  const [editWorkerService, setEditWorkerService] = useState("");
  const [editWorkerArea, setEditWorkerArea] = useState("");
  const [editWorkerExp, setEditWorkerExp] = useState("");

  // Filters State
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [workerServiceFilter, setWorkerServiceFilter] = useState("ALL");
  const [workerAreaFilter, setWorkerAreaFilter] = useState("");

  // Auth Guard & Real-Time Collections Sync
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setUser(null);
        // Clean up any existing firestore subscriptions when logged out
        unsubscribes.forEach(unsub => unsub());
        unsubscribes = [];
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        setLoadingData(true);

        // 1. Subscribe to Bookings
        const unsubBookings = onSnapshot(
          query(collection(db, "bookings"), orderBy("createdAt", "desc")),
          (snap) => {
            setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingData(false);
          },
          (err) => {
            console.error("Bookings real-time listener failed:", err);
            setLoadingData(false);
          }
        );

        // 2. Subscribe to Workers
        const unsubWorkers = onSnapshot(
          collection(db, "workers"),
          (snap) => {
            setWorkers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkerMetrics[]);
          },
          (err) => console.error("Workers real-time listener failed:", err)
        );

        // 3. Subscribe to Payments
        const unsubPayments = onSnapshot(
          query(collection(db, "payments"), orderBy("createdAt", "desc")),
          (snap) => {
            setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Payments real-time listener failed:", err)
        );

        // 4. Subscribe to Reviews
        const unsubReviews = onSnapshot(
          query(collection(db, "reviews"), orderBy("createdAt", "desc")),
          (snap) => {
            setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Reviews real-time listener failed:", err)
        );

        // 5. Subscribe to Complaints
        const unsubComplaints = onSnapshot(
          query(collection(db, "complaints"), orderBy("createdAt", "desc")),
          (snap) => {
            setComplaints(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Complaints real-time listener failed:", err)
        );

        // 6. Subscribe to Admin Logs
        const unsubLogs = onSnapshot(
          query(collection(db, "admin_logs"), orderBy("createdAt", "desc")),
          (snap) => {
            setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Admin logs real-time listener failed:", err)
        );

        // 7. Subscribe to Services
        const unsubServices = onSnapshot(
          collection(db, "services"),
          (snap) => {
            if (snap.empty) {
              // Seed from SERVICES_LIST if collection is empty
              const seedServices = async () => {
                for (const s of SERVICES_LIST) {
                  await setDoc(doc(db, "services", s.id), s);
                }
              };
              seedServices();
            } else {
              setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
          },
          (err) => console.error("Services real-time listener failed:", err)
        );

        unsubscribes = [unsubBookings, unsubWorkers, unsubPayments, unsubReviews, unsubComplaints, unsubLogs, unsubServices];
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const fetchData = async () => {
    // No-op. Data is synchronized in real-time via onSnapshot subscriptions.
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  // Helper to log administrative actions
  const logAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, "admin_logs"), {
        adminEmail: user?.email || "system",
        action,
        details,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  // Create Worker
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerMobile || !newWorkerService || !newWorkerArea || !newWorkerExp) return;

    try {
      const wDoc = {
        name: newWorkerName,
        mobile: newWorkerMobile,
        serviceType: newWorkerService,
        area: newWorkerArea.toLowerCase().trim(),
        experience: parseInt(newWorkerExp, 10) || 1,
        rating: 5.0,
        totalReviews: 0,
        totalAssignedJobs: 0,
        totalAcceptedJobs: 0,
        totalRejectedJobs: 0,
        totalCompletedJobs: 0,
        lastActivity: serverTimestamp(),
        status: "active" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "workers"), wDoc);
      await logAction("CREATE_WORKER", `Created worker ${newWorkerName} (${newWorkerService}) with ID ${docRef.id}`);
      
      setShowAddWorker(false);
      setNewWorkerName("");
      setNewWorkerMobile("");
      setNewWorkerService("");
      setNewWorkerArea("");
      setNewWorkerExp("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Worker
  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !editWorkerName || !editWorkerMobile || !editWorkerService || !editWorkerArea || !editWorkerExp) return;

    try {
      const workerRef = doc(db, "workers", editingWorker.id);
      await updateDoc(workerRef, {
        name: editWorkerName,
        mobile: editWorkerMobile,
        serviceType: editWorkerService,
        area: editWorkerArea.toLowerCase().trim(),
        experience: parseInt(editWorkerExp, 10) || 1,
      });

      await logAction("EDIT_WORKER", `Updated profile for worker ${editWorkerName} (ID: ${editingWorker.id})`);
      setEditingWorker(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Change Worker Status (Suspend, Reactivate, Remove)
  const handleWorkerStatusChange = async (workerId: string, name: string, status: "active" | "suspended" | "removed") => {
    try {
      const workerRef = doc(db, "workers", workerId);
      await updateDoc(workerRef, { status });
      await logAction("WORKER_STATUS_CHANGE", `Changed status of ${name} (ID: ${workerId}) to ${status.toUpperCase()}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Customer Complaint
  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintWorkerId || !complaintBookingId || !complaintNotes) return;

    try {
      const worker = workers.find(w => w.id === complaintWorkerId);
      const workerName = worker ? worker.name : "Unknown Worker";

      await addDoc(collection(db, "complaints"), {
        workerId: complaintWorkerId,
        workerName,
        bookingId: complaintBookingId,
        description: complaintNotes,
        createdAt: serverTimestamp(),
      });

      await logAction("CREATE_COMPLAINT", `Logged complaint against worker ${workerName} (ID: ${complaintWorkerId}) for Lead ${complaintBookingId}`);

      setShowAddComplaint(false);
      setComplaintWorkerId("");
      setComplaintBookingId("");
      setComplaintNotes("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to dynamically get service display name
  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || SERVICES_LIST.find(s => s.id === id)?.name || id;
  };

  // FAQ Dynamic list handlers
  const handleAddFaqField = () => {
    setServiceFaqs([...serviceFaqs, { question: "", answer: "" }]);
  };

  const handleRemoveFaqField = (index: number) => {
    setServiceFaqs(serviceFaqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...serviceFaqs];
    updated[index][field] = value;
    setServiceFaqs(updated);
  };

  // Add/Edit Service submit handler
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceIdInput || !serviceNameInput || !serviceAssuranceFeeInput) return;

    setIsUploadingLogo(true);
    try {
      const parsedFee = parseFloat(serviceAssuranceFeeInput) || 0;
      const cleanServiceId = serviceIdInput.toLowerCase().trim();

      let finalImageUrl = serviceImageUrlInput;
      if (logoFile) {
        const extension = logoFile.name.split('.').pop() || 'png';
        const logoRef = ref(storage, `logos/${cleanServiceId}/logo.${extension}`);
        
        console.log("Starting service logo upload to path:", `logos/${cleanServiceId}/logo.${extension}`);
        
        try {
          // Attempt Firebase Storage upload with a shorter 4-second timeout
          const uploadResult = await promiseWithTimeout(
            uploadBytes(logoRef, logoFile),
            4000,
            "Storage upload timed out"
          );
          
          console.log("Upload completed, fetching download URL...");
          
          finalImageUrl = await promiseWithTimeout(
            getDownloadURL(uploadResult.ref),
            3000,
            "Fetching download URL timed out"
          );
        } catch (uploadErr) {
          console.warn("Firebase Storage failed or timed out. Falling back to compressed Base64 stored in Firestore:", uploadErr);
          // Compress the image and convert it to Base64
          finalImageUrl = await compressImageToBase64(logoFile, 256, 256);
          console.log("Successfully generated compressed Base64 fallback for logo image.");
        }
      }

      const sDoc = {
        id: cleanServiceId,
        name: serviceNameInput.trim(),
        assuranceFee: parsedFee,
        iconName: serviceIconNameInput.trim() || "Sparkles",
        imageUrl: finalImageUrl.trim(),
        description: serviceDescriptionInput.trim(),
        shortDescription: serviceShortDescInput.trim(),
        benefits: serviceBenefitsInput
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean),
        subServices: serviceSubServicesInput
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        faq: serviceFaqs.filter((f) => f.question.trim() && f.answer.trim()),
      };

      console.log("Saving service configurations to Firestore:", sDoc);
      await setDoc(doc(db, "services", sDoc.id), sDoc);
      await logAction(
        editingService ? "EDIT_SERVICE" : "CREATE_SERVICE",
        `Saved service config for ${sDoc.name} (${sDoc.id})`
      );

      // Reset form states
      setShowAddService(false);
      setEditingService(null);
      setServiceIdInput("");
      setServiceNameInput("");
      setServiceAssuranceFeeInput("");
      setServiceIconNameInput("");
      setServiceImageUrlInput("");
      setLogoFile(null);
      setServiceDescriptionInput("");
      setServiceShortDescInput("");
      setServiceBenefitsInput("");
      setServiceSubServicesInput("");
      setServiceFaqs([{ question: "", answer: "" }]);
      
      alert("Service configurations updated successfully!");
    } catch (err: any) {
      console.error("Failed to save service:", err);
      alert(
        `Error saving service configurations: ${err.message || err}\n\n` +
        "Please check:\n" +
        "1. Is Firebase Storage activated/enabled in your Firebase Console?\n" +
        "2. Does the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env.local file match the bucket name in the console (e.g. services-z-f920f.appspot.com vs services-z-f920f.firebasestorage.app)?\n" +
        "3. Are your Firebase Storage security rules deployed?"
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleEditServiceClick = (service: any) => {
    setEditingService(service);
    setServiceIdInput(service.id);
    setServiceNameInput(service.name);
    setServiceAssuranceFeeInput(service.assuranceFee.toString());
    setServiceIconNameInput(service.iconName);
    setServiceImageUrlInput(service.imageUrl || "");
    setLogoFile(null);
    setServiceDescriptionInput(service.description || "");
    setServiceShortDescInput(service.shortDescription || "");
    setServiceBenefitsInput((service.benefits || []).join("\n"));
    setServiceSubServicesInput((service.subServices || []).join("\n"));
    setServiceFaqs(
      service.faq && service.faq.length > 0
        ? service.faq
        : [{ question: "", answer: "" }]
    );
    setShowAddService(true);
  };

  const handleDeleteService = async (serviceId: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to permanently delete service "${name}"? This will disable booking for this category.`)) {
      try {
        await deleteDoc(doc(db, "services", serviceId));
        await logAction("DELETE_SERVICE", `Deleted service ${name} (${serviceId})`);
      } catch (err) {
        console.error(err);
        alert("Failed to delete service.");
      }
    }
  };

  // Assign Worker to Lead (using Firestore Transactions)
  const handleAssignWorker = async (leadId: string, workerId: string, workerName: string) => {
    try {
      const leadRef = doc(db, "bookings", leadId);
      const workerRef = doc(db, "workers", workerId);

      await runTransaction(db, async (transaction) => {
        const leadDoc = await transaction.get(leadRef);
        const workerDoc = await transaction.get(workerRef);

        if (!leadDoc.exists() || !workerDoc.exists()) {
          throw new Error("Lead or Worker document does not exist.");
        }

        const currentAssigned = workerDoc.data().totalAssignedJobs || 0;

        transaction.update(leadRef, {
          status: "ASSIGNED",
          assignedWorkerId: workerId,
          updatedAt: serverTimestamp(),
        });

        transaction.update(workerRef, {
          totalAssignedJobs: currentAssigned + 1,
          lastActivity: serverTimestamp(),
        });
      });

      await logAction("ASSIGN_LEAD", `Assigned Lead ${leadId} to worker ${workerName} (ID: ${workerId})`);
      setSelectedLead(null);
      fetchData();
    } catch (err: any) {
      console.error("Assignment transaction failed:", err);
      alert("Failed to assign worker: " + err.message);
    }
  };

  // Filter and Sort Worker Recommendations
  const getRecommendedWorkers = (serviceType: string, area: string) => {
    // 1. Filter by Service Type
    // 2. Filter by Area (exact match or sector similarity)
    // 3. Exclude suspended/removed or inactive workers (recent activity > 30 days)
    return workers
      .filter((w) => {
        const isMatchesService = w.serviceType === serviceType;
        const isMatchesArea = w.area.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(w.area.toLowerCase());
        const isNotSuspendedOrRemoved = w.status === "active";
        const isNotInactive = getWorkerActivityStatus(w.lastActivity) !== "Inactive";
        
        return isMatchesService && isMatchesArea && isNotSuspendedOrRemoved && isNotInactive;
      })
      .map((w) => ({
        ...w,
        score: calculateRankingScore(w),
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Prefilled WhatsApp link generator for Workers
  const generateWorkerWhatsAppLink = (lead: any, worker: any) => {
    const text = `Hello ${worker.name}! You have been assigned a new ${getServiceName(lead.serviceType)} job in ${lead.customerArea}.\n\nView details & accept/reject here:\nhttps://servego.shop/worker/job/${lead.id}/accept?token=${lead.securityToken}`;
    return `https://wa.me/${worker.mobile.replace(/\s+/g, "")}?text=${encodeURIComponent(text)}`;
  };

  // Prefilled WhatsApp link generator for Customers
  const generateCustomerWhatsAppLink = (lead: any, worker: any) => {
    const text = `Hello ${lead.customerName}! We have assigned ${worker.name} (Contact: ${worker.mobile}, Rating: ${worker.rating}★) to resolve your service request. They will contact you shortly to coordinate timing. Thank you for choosing ServeGo!`;
    return `https://wa.me/${lead.customerMobile.replace(/\s+/g, "")}?text=${encodeURIComponent(text)}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-bold">Verifying admin credentials...</div>
      </div>
    );
  }

  if (!user) return null;

  // Compute metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "NEW" || l.status === "REJECTED").length;
  const acceptedLeads = leads.filter(l => l.status === "ACCEPTED").length;
  const completedJobs = leads.filter(l => l.status === "COMPLETED").length;
  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const activeWorkersCount = workers.filter(w => w.status === "active").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      
      {/* Top Navbar */}
      <header className="border-b border-border/60 bg-card py-4 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ServeGo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-2xl font-black tracking-tighter text-black">
                ServeGo
              </span>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">Logged in: <strong>{user.email}</strong></span>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border/80 rounded-xl text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="md:w-64 shrink-0 flex flex-col gap-2">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "leads", label: "Leads / Bookings", icon: FileText, badge: newLeads },
            { id: "workers", label: "Worker Database", icon: Users },
            { id: "services", label: "Services Config", icon: ClipboardList },
            { id: "complaints", label: "Complaints Tracker", icon: AlertTriangle },
            { id: "reviews", label: "Customer Reviews", icon: Star },
            { id: "revenue", label: "Assurance Revenue", icon: DollarSign },
            { id: "logs", label: "Audit Logs", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedLead(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Dashboard Panels */}
        <main className="flex-1 min-w-0">
          {loadingData ? (
            <div className="bg-card border border-border/60 p-12 rounded-3xl text-center">
              <div className="text-lg font-bold">Synchronizing Firestore collections...</div>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Total Bookings", val: totalLeads, icon: FileText, color: "text-blue-500" },
                      { label: "Pending Leads", val: newLeads, icon: AlertTriangle, color: "text-amber-500" },
                      { label: "Jobs Completed", val: completedJobs, icon: CheckCircle, color: "text-emerald-500" },
                      { label: "Fee Revenue", val: `₹${totalRevenue}`, icon: DollarSign, color: "text-primary" },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">{stat.label}</span>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div className="text-3xl font-black tracking-tight">{stat.val}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Activity Lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Assignments */}
                    <div className="bg-card border border-border/60 p-6 rounded-2xl space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" /> Unassigned Leads
                      </h3>
                      <div className="space-y-3">
                        {leads.filter(l => l.status === "NEW" || l.status === "REJECTED").slice(0, 5).map((lead) => (
                          <div key={lead.id} className="p-4 border border-border/80 rounded-xl flex items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                                {getServiceName(lead.serviceType)}
                              </span>
                              <h4 className="font-bold text-sm mt-1">{lead.customerName} - {lead.customerArea}</h4>
                              <p className="text-muted-foreground text-xs">{new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setActiveTab("leads");
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                        {leads.filter(l => l.status === "NEW" || l.status === "REJECTED").length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-6">All leads are currently assigned!</p>
                        )}
                      </div>
                    </div>

                    {/* Highly Ranked Active Partners */}
                    <div className="bg-card border border-border/60 p-6 rounded-2xl space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Top Performers
                      </h3>
                      <div className="space-y-3">
                        {workers
                          .filter(w => w.status === "active")
                          .map(w => ({ ...w, score: calculateRankingScore(w) }))
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 5)
                          .map((worker) => (
                            <div key={worker.id} className="p-4 border border-border/80 rounded-xl flex items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-sm">{worker.name} ({getServiceName(worker.serviceType)})</h4>
                                <span className="text-xs text-muted-foreground">Rating: <strong>{worker.rating}★</strong> | Jobs: {worker.totalCompletedJobs}</span>
                              </div>
                              <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                                {worker.score} pts
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Leads */}
              {activeTab === "leads" && (
                <div className="space-y-6">
                  {selectedLead ? (
                    /* Assignment Sub-panel */
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                      <div className="flex justify-between items-start border-b border-border/60 pb-6">
                        <div>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                            {getServiceName(selectedLead.serviceType)}
                          </span>
                          <h2 className="text-2xl font-black mt-1">Assign Worker to Lead</h2>
                          <p className="text-muted-foreground text-sm mt-0.5">Booking ID: {selectedLead.id}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedLead(null)}
                          className="px-4 py-2 border border-border/80 rounded-xl text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Lead Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/60 text-sm">
                        <div className="space-y-2">
                          <p><strong>Customer Name:</strong> {selectedLead.customerName}</p>
                          <p><strong>Contact Mobile:</strong> {selectedLead.customerMobile}</p>
                          <p><strong>Service Area:</strong> {selectedLead.customerArea}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Full Address:</strong> {selectedLead.customerAddress}</p>
                          <p><strong>Assurance Fee:</strong> Paid (Verified)</p>
                          <p><strong>Description:</strong> {selectedLead.description}</p>
                        </div>
                      </div>

                      {/* Recommendations Engine */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                          🏆 Recommended Workers in {selectedLead.customerArea} ({getServiceName(selectedLead.serviceType)})
                        </h3>
                        
                        <div className="space-y-3">
                          {getRecommendedWorkers(selectedLead.serviceType, selectedLead.customerArea).map((recWorker, index) => (
                            <div 
                              key={recWorker.id} 
                              className="p-5 border border-border/80 hover:border-primary/50 bg-background/50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
                            >
                              <div className="space-y-1">
                                <h4 className="font-bold text-base flex items-center gap-2">
                                  <span className="text-primary font-black">#{index + 1}</span> {recWorker.name}
                                  <span className="text-xs font-semibold text-muted-foreground font-mono">({recWorker.experience} yrs exp)</span>
                                </h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>Rating: <strong className="text-foreground">{recWorker.rating}★</strong></span>
                                  <span>Completed Jobs: <strong className="text-foreground">{recWorker.totalCompletedJobs}</strong></span>
                                  <span>Acceptance Rate: <strong className="text-foreground">{recWorker.totalAssignedJobs > 0 ? Math.round((recWorker.totalAcceptedJobs / recWorker.totalAssignedJobs) * 100) : 100}%</strong></span>
                                  <span>Completion Rate: <strong className="text-foreground">{recWorker.totalAcceptedJobs > 0 ? Math.round((recWorker.totalCompletedJobs / recWorker.totalAcceptedJobs) * 100) : 100}%</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-between md:justify-end">
                                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl font-mono">
                                  Score: {recWorker.score}
                                </span>
                                <button
                                  onClick={() => handleAssignWorker(selectedLead.id, recWorker.id, recWorker.name)}
                                  className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          ))}

                          {getRecommendedWorkers(selectedLead.serviceType, selectedLead.customerArea).length === 0 && (
                            <div className="p-8 border border-dashed border-border/80 rounded-2xl text-center text-muted-foreground">
                              No active recommended workers found matching this category and area. Ensure workers exist with active status.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Leads Table */
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-black">Lead Assignments Manager</h2>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                          <select
                            value={leadStatusFilter}
                            onChange={(e) => setLeadStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-background border border-border/80 rounded-xl text-xs focus:outline-none"
                          >
                            <option value="ALL">All Statuses</option>
                            <option value="NEW">New Leads</option>
                            <option value="ASSIGNED">Assigned Leads</option>
                            <option value="ACCEPTED">Accepted Leads</option>
                            <option value="COMPLETED">Completed Jobs</option>
                            <option value="REJECTED">Rejected Leads</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                            <tr>
                              <th className="px-6 py-4">Service</th>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4">Area</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Assigned Worker</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {leads
                              .filter(l => leadStatusFilter === "ALL" || l.status === leadStatusFilter)
                              .map((lead) => {
                                const assignedWorker = workers.find(w => w.id === lead.assignedWorkerId);
                                return (
                                  <tr key={lead.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4 font-bold">
                                      {getServiceName(lead.serviceType)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="font-semibold">{lead.customerName}</div>
                                      <div className="text-xs text-muted-foreground">{lead.customerMobile}</div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{lead.customerArea}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                        lead.status === "NEW" ? "bg-blue-100 text-blue-800" :
                                        lead.status === "ASSIGNED" ? "bg-amber-100 text-amber-800" :
                                        lead.status === "ACCEPTED" ? "bg-purple-100 text-purple-800" :
                                        lead.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                                        "bg-rose-100 text-rose-800"
                                      }`}>
                                        {lead.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      {assignedWorker ? (
                                        <div className="font-medium text-foreground">
                                          {assignedWorker.name}
                                          <div className="text-xs text-muted-foreground">{assignedWorker.mobile}</div>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-xs italic">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                      {/* Assignment trigger */}
                                      {(lead.status === "NEW" || lead.status === "REJECTED") && (
                                        <button
                                          onClick={() => setSelectedLead(lead)}
                                          className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                                        >
                                          Assign Partner
                                        </button>
                                      )}
                                      
                                      {/* WhatsApp to Worker */}
                                      {lead.status === "ASSIGNED" && assignedWorker && (
                                        <a
                                          href={generateWorkerWhatsAppLink(lead, assignedWorker)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" /> Dispatch Worker
                                        </a>
                                      )}

                                      {/* WhatsApp to Customer */}
                                      {lead.status === "ASSIGNED" && assignedWorker && (
                                        <a
                                          href={generateCustomerWhatsAppLink(lead, assignedWorker)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold text-xs rounded-lg transition-colors ml-2"
                                        >
                                          Notify Customer
                                        </a>
                                      )}

                                      {/* View completion photo */}
                                      {lead.status === "COMPLETED" && lead.completionPhotoUrl && (
                                        <a
                                          href={lead.completionPhotoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border/80 text-muted-foreground hover:text-foreground text-xs font-bold rounded-lg transition-all"
                                        >
                                          Proof <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            {leads.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                  No bookings matches criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Workers */}
              {activeTab === "workers" && (
                <div className="space-y-6">
                  {/* Controls Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-black">Service Partners Network</h2>
                    <button
                      onClick={() => {
                        setEditingWorker(null);
                        setShowAddWorker(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Add New Partner
                    </button>
                  </div>

                  {/* Add Worker Modal Block */}
                  {showAddWorker && (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
                      <h3 className="text-lg font-black mb-6">Register Service Partner</h3>
                      <form onSubmit={handleAddWorker} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={newWorkerName}
                            onChange={(e) => setNewWorkerName(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                          <input
                            type="tel"
                            required
                            placeholder="WhatsApp Number (e.g. +91 9876543210)"
                            value={newWorkerMobile}
                            onChange={(e) => setNewWorkerMobile(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <select
                            required
                            value={newWorkerService}
                            onChange={(e) => setNewWorkerService(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          >
                            <option value="">Select Service Category</option>
                            {SERVICES_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Service Area sector"
                            value={newWorkerArea}
                            onChange={(e) => setNewWorkerArea(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                          <input
                            type="number"
                            required
                            placeholder="Years of Experience"
                            value={newWorkerExp}
                            onChange={(e) => setNewWorkerExp(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer">
                            Create Profile
                          </button>
                          <button type="button" onClick={() => setShowAddWorker(false)} className="px-6 py-2.5 border border-border/85 rounded-xl text-sm font-semibold cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Edit Worker Panel */}
                  {editingWorker && (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
                      <h3 className="text-lg font-black mb-6">Modify Partner Settings</h3>
                      <form onSubmit={handleEditWorker} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={editWorkerName}
                            onChange={(e) => setEditWorkerName(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                          <input
                            type="tel"
                            required
                            placeholder="WhatsApp Number"
                            value={editWorkerMobile}
                            onChange={(e) => setEditWorkerMobile(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <select
                            required
                            value={editWorkerService}
                            onChange={(e) => setEditWorkerService(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          >
                            <option value="">Select Service Category</option>
                            {(services.length > 0 ? services : SERVICES_LIST).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Service Area sector"
                            value={editWorkerArea}
                            onChange={(e) => setEditWorkerArea(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                          <input
                            type="number"
                            required
                            placeholder="Years of Experience"
                            value={editWorkerExp}
                            onChange={(e) => setEditWorkerExp(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer">
                            Save Configurations
                          </button>
                          <button type="button" onClick={() => setEditingWorker(null)} className="px-6 py-2.5 border border-border/85 rounded-xl text-sm font-semibold cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Filter panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border/60 p-6 rounded-2xl">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Filter Category</label>
                      <select
                        value={workerServiceFilter}
                        onChange={(e) => setWorkerServiceFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs"
                      >
                        <option value="ALL">All Categories</option>
                        {SERVICES_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Filter Area</label>
                      <input
                        type="text"
                        value={workerAreaFilter}
                        onChange={(e) => setWorkerAreaFilter(e.target.value)}
                        placeholder="e.g. Sector 62"
                        className="w-full px-3 py-2 bg-background border border-border/80 rounded-xl text-xs"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button 
                        onClick={() => { setWorkerServiceFilter("ALL"); setWorkerAreaFilter(""); }}
                        className="px-4 py-2 border border-border/85 rounded-xl text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  </div>

                  {/* Workers Table */}
                  <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                          <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Area / City</th>
                            <th className="px-6 py-4">Rating / Jobs</th>
                            <th className="px-6 py-4">Ranking Score</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {workers
                            .filter(w => w.status !== "removed")
                            .filter(w => workerServiceFilter === "ALL" || w.serviceType === workerServiceFilter)
                            .filter(w => !workerAreaFilter || w.area.toLowerCase().includes(workerAreaFilter.toLowerCase()))
                            .map((worker) => {
                              const dynamicScore = calculateRankingScore(worker);
                              const actStatus = getWorkerActivityStatus(worker.lastActivity);
                              return (
                                <tr key={worker.id} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">{worker.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{worker.mobile}</div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-primary">
                                    {getServiceName(worker.serviceType)}
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground font-medium">{worker.area}</td>
                                  <td className="px-6 py-4">
                                    <div className="font-bold flex items-center gap-1 text-foreground">{worker.rating}★ <span className="text-xs text-muted-foreground font-normal">({worker.totalReviews} reviews)</span></div>
                                    <div className="text-xs text-muted-foreground">Jobs: {worker.totalCompletedJobs} comp / {worker.totalAssignedJobs} assign</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl font-mono">
                                      {dynamicScore}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="space-y-1">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${
                                        worker.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                      }`}>
                                        {worker.status}
                                      </span>
                                      <span className="block text-[10px] text-muted-foreground">
                                        Act: {actStatus}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => {
                                        setEditingWorker(worker);
                                        setEditWorkerName(worker.name);
                                        setEditWorkerMobile(worker.mobile);
                                        setEditWorkerService(worker.serviceType);
                                        setEditWorkerArea(worker.area);
                                        setEditWorkerExp(worker.experience.toString());
                                      }}
                                      className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Edit
                                    </button>

                                    {worker.status === "active" ? (
                                      <button
                                        onClick={() => handleWorkerStatusChange(worker.id, worker.name, "suspended")}
                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer animate-pulse"
                                      >
                                        Suspend
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleWorkerStatusChange(worker.id, worker.name, "active")}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Activate
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you absolutely sure you want to permanently remove ${worker.name}?`)) {
                                          handleWorkerStatusChange(worker.id, worker.name, "removed");
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Complaints */}
              {activeTab === "complaints" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black">Worker Complaints Log</h2>
                    <button
                      onClick={() => setShowAddComplaint(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> File New Complaint
                    </button>
                  </div>

                  {showAddComplaint && (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
                      <h3 className="text-lg font-black mb-6">Create Customer Complaint File</h3>
                      <form onSubmit={handleAddComplaint} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <select
                            required
                            value={complaintWorkerId}
                            onChange={(e) => setComplaintWorkerId(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          >
                            <option value="">Select Service Partner</option>
                            {workers.filter(w => w.status !== "removed").map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({getServiceName(w.serviceType)})</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Booking ID / Lead Reference"
                            value={complaintBookingId}
                            onChange={(e) => setComplaintBookingId(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                          />
                        </div>
                        <textarea
                          required
                          rows={4}
                          placeholder="Evidence, customer feedback notes, and violation descriptions..."
                          value={complaintNotes}
                          onChange={(e) => setComplaintNotes(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none"
                        />
                        <div className="flex gap-4">
                          <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer">
                            Log Complaint
                          </button>
                          <button type="button" onClick={() => setShowAddComplaint(false)} className="px-6 py-2.5 border border-border/85 rounded-xl text-sm font-semibold cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                          <tr>
                            <th className="px-6 py-4">Worker Name</th>
                            <th className="px-6 py-4">Booking ID</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Date Filed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {complaints.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-6 py-4 font-bold text-foreground">{item.workerName}</td>
                              <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item.bookingId}</td>
                              <td className="px-6 py-4 text-muted-foreground leading-relaxed">{item.description}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">
                                {new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {complaints.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                No complaints filed! All partners are in good standing.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Reviews */}
              {activeTab === "reviews" && (
                <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border/60">
                    <h2 className="text-xl font-black">Customer Feedback Reviews</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="px-6 py-4">Rating</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Worker</th>
                          <th className="px-6 py-4">Review Text</th>
                          <th className="px-6 py-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {reviews.map((rev) => {
                          const wName = workers.find(w => w.id === rev.workerId)?.name || "Partner";
                          return (
                            <tr key={rev.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded">
                                  {rev.rating}★
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold">{rev.customerName || "Anonymous"}</td>
                              <td className="px-6 py-4 text-primary font-semibold">{wName}</td>
                              <td className="px-6 py-4 text-muted-foreground italic leading-relaxed">"{rev.reviewText}"</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">
                                {new Date(rev.createdAt?.seconds * 1000).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                        {reviews.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                              No customer reviews received yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 6: Revenue */}
              {activeTab === "revenue" && (
                <div className="space-y-6">
                  <div className="bg-card border border-border/60 p-8 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-muted-foreground uppercase">Service Assurance Fees Collected</h3>
                      <div className="text-5xl font-black tracking-tight mt-2">₹{totalRevenue}</div>
                    </div>
                    <DollarSign className="w-16 h-16 text-primary/20 shrink-0" />
                  </div>

                  <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border/60">
                      <h3 className="text-base font-bold">Transaction History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                          <tr>
                            <th className="px-6 py-4">Booking ID</th>
                            <th className="px-6 py-4">Razorpay Order ID</th>
                            <th className="px-6 py-4">Razorpay Payment ID</th>
                            <th className="px-6 py-4">Assurance Fee</th>
                            <th className="px-6 py-4">Date Settled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold">{p.bookingId}</td>
                              <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.razorpayOrderId}</td>
                              <td className="px-6 py-4 font-mono text-xs text-primary">{p.razorpayPaymentId}</td>
                              <td className="px-6 py-4 font-black">₹{p.amount}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">
                                {new Date(p.createdAt?.seconds * 1000).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                No assurance payments recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Logs */}
              {activeTab === "logs" && (
                <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border/60">
                    <h2 className="text-xl font-black">Administrative Audit Trails</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border-b border-border/60">
                      <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="px-6 py-4">Admin Email</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-xs">{log.adminEmail}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded uppercase">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">{log.details}</td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {new Date(log.createdAt?.seconds * 1000).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                              No log tracks found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 8: Services Manager */}
              {activeTab === "services" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black">Marketplace Services Config</h2>
                    {!showAddService && (
                      <button
                        onClick={() => {
                          setEditingService(null);
                          setShowAddService(true);
                          setServiceIdInput("");
                          setServiceNameInput("");
                          setServiceAssuranceFeeInput("");
                          setServiceIconNameInput("Sparkles");
                          setServiceImageUrlInput("");
                          setLogoFile(null);
                          setServiceDescriptionInput("");
                          setServiceShortDescInput("");
                          setServiceBenefitsInput("");
                          setServiceSubServicesInput("");
                          setServiceFaqs([{ question: "", answer: "" }]);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add New Service
                      </button>
                    )}
                  </div>

                  {showAddService ? (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                      <h3 className="text-lg font-black">{editingService ? `Edit Service: ${editingService.name}` : "Create New Service Category"}</h3>
                      <form onSubmit={handleSaveService} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Service ID (slug, lowercase)</label>
                            <input
                              type="text"
                              required
                              disabled={!!editingService}
                              placeholder="e.g. pest-control"
                              value={serviceIdInput}
                              onChange={(e) => setServiceIdInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Service Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Pest Control"
                              value={serviceNameInput}
                              onChange={(e) => setServiceNameInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Assurance Booking Fee (₹)</label>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 149"
                              value={serviceAssuranceFeeInput}
                              onChange={(e) => setServiceAssuranceFeeInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Lucide Icon Name</label>
                            <select
                              value={serviceIconNameInput}
                              onChange={(e) => setServiceIconNameInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="Zap">Zap (Electrician)</option>
                              <option value="Droplet">Droplet (Plumber)</option>
                              <option value="Hammer">Hammer (Carpenter)</option>
                              <option value="Paintbrush">Paintbrush (Painter)</option>
                              <option value="UserCheck">UserCheck (Labour)</option>
                              <option value="Grid">Grid (Mason)</option>
                              <option value="Flame">Flame (Welder)</option>
                              <option value="Wind">Wind (AC Repair)</option>
                              <option value="ShieldAlert">ShieldAlert (RO Filter)</option>
                              <option value="Video">Video (CCTV)</option>
                              <option value="Sparkles">Sparkles (Cleaning)</option>
                              <option value="Bug">Bug (Pest Control)</option>
                              <option value="Truck">Truck (Movers)</option>
                              <option value="Wrench">Wrench</option>
                              <option value="Settings">Settings</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Short Description</label>
                            <input
                              type="text"
                              required
                              placeholder="Brief 1-sentence sales summary"
                              value={serviceShortDescInput}
                              onChange={(e) => setServiceShortDescInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        {/* Custom Service Logo (Optional) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80 block">Custom Logo Image (Optional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("File is too large. Maximum size allowed is 2MB.");
                                    e.target.value = "";
                                    setLogoFile(null);
                                    return;
                                  }
                                  if (!file.type.startsWith("image/")) {
                                    alert("Invalid file type. Please upload an image file (PNG, JPG, SVG, WEBP).");
                                    e.target.value = "";
                                    setLogoFile(null);
                                    return;
                                  }
                                  setLogoFile(file);
                                }
                              }}
                              className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Upload PNG, JPG, or SVG. Replaces Lucide icon.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Or Logo Image URL</label>
                            <input
                              type="text"
                              placeholder="e.g. https://example.com/logo.png"
                              value={serviceImageUrlInput}
                              onChange={(e) => setServiceImageUrlInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>

                          <div className="flex flex-col justify-center items-center space-y-2">
                            <span className="text-xs font-bold text-foreground/60">Logo Preview</span>
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border/60 flex items-center justify-center text-primary overflow-hidden">
                              {logoFile ? (
                                <img src={URL.createObjectURL(logoFile)} alt="Local Preview" className="w-full h-full object-cover" />
                              ) : serviceImageUrlInput ? (
                                <img src={serviceImageUrlInput} alt="Url Preview" className="w-full h-full object-cover" />
                              ) : (
                                <ServiceIcon name={serviceIconNameInput || "Sparkles"} className="w-7 h-7" />
                              )}
                            </div>
                            {(logoFile || serviceImageUrlInput) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoFile(null);
                                  setServiceImageUrlInput("");
                                }}
                                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                              >
                                Reset to Default Icon
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground/80">Long Description</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Detailed description of what this service offers..."
                            value={serviceDescriptionInput}
                            onChange={(e) => setServiceDescriptionInput(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Benefits / Guarantees (one per line)</label>
                            <textarea
                              rows={4}
                              placeholder="e.g. 30-day warranty on all repairs&#10;Background-checked professionals"
                              value={serviceBenefitsInput}
                              onChange={(e) => setServiceBenefitsInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Sub-Services Included (one per line)</label>
                            <textarea
                              rows={4}
                              placeholder="e.g. Ceiling fan installation&#10;Switchboard troubleshooting"
                              value={serviceSubServicesInput}
                              onChange={(e) => setServiceSubServicesInput(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 border-t border-border/60 pt-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-foreground">Frequently Asked Questions (FAQ)</h4>
                            <button
                              type="button"
                              onClick={handleAddFaqField}
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add FAQ
                            </button>
                          </div>

                          <div className="space-y-4">
                            {serviceFaqs.map((faq, index) => (
                              <div key={index} className="p-4 border border-border/80 rounded-xl space-y-3 relative bg-muted/20">
                                {serviceFaqs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFaqField(index)}
                                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Question (e.g. Is parts replacement cost included?)"
                                    value={faq.question}
                                    onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-xs"
                                  />
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="Answer..."
                                    value={faq.answer}
                                    onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-xs resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4 border-t border-border/60 pt-6">
                          <button
                            type="submit"
                            disabled={isUploadingLogo}
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-primary/30 flex items-center gap-2 disabled:opacity-50"
                          >
                            {isUploadingLogo ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                <span>Uploading Logo...</span>
                              </>
                            ) : editingService ? (
                              "Save Service Changes"
                            ) : (
                              "Publish Service Category"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddService(false);
                              setEditingService(null);
                            }}
                            className="px-6 py-3 border border-border/80 rounded-xl text-sm font-semibold cursor-pointer hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                            <tr>
                              <th className="px-6 py-4">Service Category</th>
                              <th className="px-6 py-4">Assurance Fee</th>
                              <th className="px-6 py-4">Sub-Services</th>
                              <th className="px-6 py-4">FAQs</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {services.map((s) => (
                              <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                                      {s.imageUrl ? (
                                        <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <ServiceIcon name={s.iconName || "Sparkles"} className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-foreground">{s.name}</div>
                                      <div className="text-xs font-mono text-muted-foreground">ID: {s.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-black text-foreground">
                                  ₹{s.assuranceFee}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                                  {s.subServices ? s.subServices.length : 0} items
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                                  {s.faq ? s.faq.length : 0} items
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleEditServiceClick(s)}
                                    className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Edit Config
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(s.id, s.name)}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
