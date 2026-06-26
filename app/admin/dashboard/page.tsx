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
  ClipboardList,
  Settings2,
  Pill,
  ShoppingBag,
  Utensils,
  Construction,
  Layers,
  Wrench,
  Car,
  BarChart3,
  Upload,
  Trash2,
  Edit,
  Check,
  X,
  Clock
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "leads"
    | "workers"
    | "complaints"
    | "reviews"
    | "revenue"
    | "logs"
    | "services"
    | "toggles"
    | "medical-shops"
    | "grocery-shops"
    | "restaurants-shops"
    | "building-shops"
    | "centring-shops"
    | "hardware-shops"
    | "vehicle-rental"
    | "partner-analytics"
  >("overview");

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

  // Toggles, Shops, Vehicles & Interests state
  const [shops, setShops] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [toggles, setToggles] = useState<any>({
    localPartnerServicesEnabled: false,
    vehicleRentalEnabled: false
  });

  // Shop CRUD State
  const [showAddShop, setShowAddShop] = useState(false);
  const [editingShop, setEditingShop] = useState<any | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopOwnerName, setShopOwnerName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopWhatsapp, setShopWhatsapp] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopArea, setShopArea] = useState("");
  const [shopGoogleMapsLink, setShopGoogleMapsLink] = useState("");
  const [shopOpeningTime, setShopOpeningTime] = useState("");
  const [shopClosingTime, setShopClosingTime] = useState("");
  const [shopAvailableDays, setShopAvailableDays] = useState<string>("Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
  const [shopDeliveryAvailable, setShopDeliveryAvailable] = useState(true);
  const [shopDeliveryCharges, setShopDeliveryCharges] = useState("0");
  const [shopDescription, setShopDescription] = useState("");
  const [shopCategory, setShopCategory] = useState("medical-shops");
  const [shopRating, setShopRating] = useState("5.0");
  const [shopImageFiles, setShopImageFiles] = useState<File[]>([]);
  const [shopExistingImages, setShopExistingImages] = useState<string[]>([]);
  const [shopStatus, setShopStatus] = useState<"active" | "inactive">("active");

  // Vehicle CRUD State
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleOwnerName, setVehicleOwnerName] = useState("");
  const [vehiclePhone, setVehiclePhone] = useState("");
  const [vehicleWhatsapp, setVehicleWhatsapp] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("vehicle-sedan");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleDriverName, setVehicleDriverName] = useState("");
  const [vehicleArea, setVehicleArea] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [vehicleAvailability, setVehicleAvailability] = useState<"available" | "unavailable">("available");
  const [vehicleImageFiles, setVehicleImageFiles] = useState<File[]>([]);
  const [vehicleExistingImages, setVehicleExistingImages] = useState<string[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<"active" | "inactive">("active");
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

        // 8. Subscribe to Shops
        const unsubShops = onSnapshot(
          collection(db, "shops"),
          (snap) => {
            setShops(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Shops real-time listener failed:", err)
        );

        // 9. Subscribe to Vehicles
        const unsubVehicles = onSnapshot(
          collection(db, "vehicles"),
          (snap) => {
            setVehicles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Vehicles real-time listener failed:", err)
        );

        // 10. Subscribe to Toggles
        const unsubToggles = onSnapshot(
          doc(db, "system_config", "toggles"),
          (docSnap) => {
            if (docSnap.exists()) {
              setToggles(docSnap.data());
            } else {
              setDoc(doc(db, "system_config", "toggles"), {
                localPartnerServicesEnabled: false,
                vehicleRentalEnabled: false
              });
            }
          },
          (err) => console.error("Toggles real-time listener failed:", err)
        );

        // 11. Subscribe to Launch Interests
        const unsubInterests = onSnapshot(
          collection(db, "launch_interests"),
          (snap) => {
            setInterests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Interests real-time listener failed:", err)
        );

        unsubscribes = [
          unsubBookings,
          unsubWorkers,
          unsubPayments,
          unsubReviews,
          unsubComplaints,
          unsubLogs,
          unsubServices,
          unsubShops,
          unsubVehicles,
          unsubToggles,
          unsubInterests
        ];
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

  // 1. Feature Toggle Update
  const handleToggleChange = async (key: string, value: boolean) => {
    try {
      await updateDoc(doc(db, "system_config", "toggles"), {
        [key]: value
      });
      await logAction("UPDATE_TOGGLE", `Updated feature toggle ${key} to ${value}`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to update feature toggle: " + err.message);
    }
  };

  // 2. Shop Save Handler (Add & Edit)
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !shopOwnerName.trim() || !shopPhone.trim() || !shopAddress.trim() || !shopArea.trim()) {
      alert("Please fill in all required shop fields.");
      return;
    }

    try {
      setLoadingData(true);
      
      // Upload files or fallback base64
      let uploadedUrls: string[] = [...shopExistingImages];
      for (const file of shopImageFiles) {
        try {
          const fileRef = ref(storage, `shops/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.warn("Storage upload failed, fallback to base64", uploadErr);
          const base64 = await compressImageToBase64(file, 512, 512);
          uploadedUrls.push(base64);
        }
      }

      const shopDocData = {
        name: shopName.trim(),
        ownerName: shopOwnerName.trim(),
        phone: shopPhone.trim(),
        whatsapp: shopWhatsapp.trim() || shopPhone.trim(),
        address: shopAddress.trim(),
        area: shopArea.trim(),
        googleMapsLink: shopGoogleMapsLink.trim(),
        openingTime: shopOpeningTime || "09:00 AM",
        closingTime: shopClosingTime || "09:00 PM",
        availableDays: shopAvailableDays.split(",").map(d => d.trim()).filter(Boolean),
        deliveryAvailable: shopDeliveryAvailable,
        deliveryCharges: parseFloat(shopDeliveryCharges) || 0,
        description: shopDescription.trim(),
        category: shopCategory,
        rating: parseFloat(shopRating) || 5.0,
        status: shopStatus,
        images: uploadedUrls,
        updatedAt: serverTimestamp(),
      };

      if (editingShop) {
        await updateDoc(doc(db, "shops", editingShop.id), shopDocData);
        await logAction("EDIT_SHOP", `Edited shop ${shopName} (ID: ${editingShop.id})`);
      } else {
        await addDoc(collection(db, "shops"), {
          ...shopDocData,
          createdAt: serverTimestamp()
        });
        await logAction("ADD_SHOP", `Created new shop ${shopName}`);
      }

      // Reset
      setShowAddShop(false);
      setEditingShop(null);
      setShopName("");
      setShopOwnerName("");
      setShopPhone("");
      setShopWhatsapp("");
      setShopAddress("");
      setShopArea("");
      setShopGoogleMapsLink("");
      setShopOpeningTime("");
      setShopClosingTime("");
      setShopDeliveryAvailable(true);
      setShopDeliveryCharges("0");
      setShopDescription("");
      setShopImageFiles([]);
      setShopExistingImages([]);
      setShopStatus("active");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save shop: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // 3. Shop Delete Handler
  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`Are you sure you want to delete the shop "${shopName}"?`)) return;
    try {
      setLoadingData(true);
      await deleteDoc(doc(db, "shops", shopId));
      await logAction("DELETE_SHOP", `Deleted shop ${shopName} (ID: ${shopId})`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete shop: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // 4. Vehicle Save Handler (Add & Edit)
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleOwnerName.trim() || !vehiclePhone.trim() || !vehicleName.trim() || !vehicleNumber.trim() || !vehicleArea.trim() || !vehiclePrice.trim()) {
      alert("Please fill in all required vehicle fields.");
      return;
    }

    try {
      setLoadingData(true);

      let uploadedUrls: string[] = [...vehicleExistingImages];
      for (const file of vehicleImageFiles) {
        try {
          const fileRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.warn("Storage upload failed, fallback to base64", uploadErr);
          const base64 = await compressImageToBase64(file, 512, 512);
          uploadedUrls.push(base64);
        }
      }

      const vehicleDocData = {
        ownerName: vehicleOwnerName.trim(),
        phone: vehiclePhone.trim(),
        whatsapp: vehicleWhatsapp.trim() || vehiclePhone.trim(),
        category: vehicleCategory,
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        driverName: vehicleDriverName.trim(),
        area: vehicleArea.trim(),
        price: parseFloat(vehiclePrice) || 0,
        availability: vehicleAvailability,
        status: vehicleStatus,
        images: uploadedUrls,
        updatedAt: serverTimestamp(),
      };

      if (editingVehicle) {
        await updateDoc(doc(db, "vehicles", editingVehicle.id), vehicleDocData);
        await logAction("EDIT_VEHICLE", `Edited vehicle ${vehicleName} (ID: ${editingVehicle.id})`);
      } else {
        await addDoc(collection(db, "vehicles"), {
          ...vehicleDocData,
          createdAt: serverTimestamp()
        });
        await logAction("ADD_VEHICLE", `Created new vehicle ${vehicleName}`);
      }

      // Reset
      setShowAddVehicle(false);
      setEditingVehicle(null);
      setVehicleOwnerName("");
      setVehiclePhone("");
      setVehicleWhatsapp("");
      setVehicleName("");
      setVehicleNumber("");
      setVehicleDriverName("");
      setVehicleArea("");
      setVehiclePrice("");
      setVehicleAvailability("available");
      setVehicleImageFiles([]);
      setVehicleExistingImages([]);
      setVehicleStatus("active");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save vehicle: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // 5. Vehicle Delete Handler
  const handleDeleteVehicle = async (vehicleId: string, vehicleName: string) => {
    if (!confirm(`Are you sure you want to delete the vehicle "${vehicleName}"?`)) return;
    try {
      setLoadingData(true);
      await deleteDoc(doc(db, "vehicles", vehicleId));
      await logAction("DELETE_VEHICLE", `Deleted vehicle ${vehicleName} (ID: ${vehicleId})`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete vehicle: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper to open Edit Shop Form
  const handleEditShopClick = (shop: any) => {
    setEditingShop(shop);
    setShopName(shop.name);
    setShopOwnerName(shop.ownerName);
    setShopPhone(shop.phone);
    setShopWhatsapp(shop.whatsapp || "");
    setShopAddress(shop.address);
    setShopArea(shop.area);
    setShopGoogleMapsLink(shop.googleMapsLink || "");
    setShopOpeningTime(shop.openingTime || "");
    setShopClosingTime(shop.closingTime || "");
    setShopAvailableDays(shop.availableDays ? shop.availableDays.join(",") : "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
    setShopDeliveryAvailable(shop.deliveryAvailable);
    setShopDeliveryCharges(shop.deliveryCharges ? shop.deliveryCharges.toString() : "0");
    setShopDescription(shop.description || "");
    setShopCategory(shop.category);
    setShopRating(shop.rating ? shop.rating.toString() : "5.0");
    setShopImageFiles([]);
    setShopExistingImages(shop.images || []);
    setShopStatus(shop.status || "active");
    setShowAddShop(true);
  };

  // Helper to open Edit Vehicle Form
  const handleEditVehicleClick = (v: any) => {
    setEditingVehicle(v);
    setVehicleOwnerName(v.ownerName);
    setVehiclePhone(v.phone);
    setVehicleWhatsapp(v.whatsapp || "");
    setVehicleCategory(v.category);
    setVehicleName(v.vehicleName);
    setVehicleNumber(v.vehicleNumber);
    setVehicleDriverName(v.driverName || "");
    setVehicleArea(v.area);
    setVehiclePrice(v.price ? v.price.toString() : "");
    setVehicleAvailability(v.availability || "available");
    setVehicleImageFiles([]);
    setVehicleExistingImages(v.images || []);
    setVehicleStatus(v.status || "active");
    setShowAddVehicle(true);
  };

  // 6. Assign Partner Handler
  const handleAssignPartner = async (leadId: string, partnerId: string, partnerName: string, partnerType: "shop" | "vehicle") => {
    try {
      const leadRef = doc(db, "bookings", leadId);
      await updateDoc(leadRef, {
        status: "ASSIGNED",
        assignedPartnerId: partnerId,
        assignedPartnerType: partnerType,
        updatedAt: serverTimestamp()
      });

      let partnerDetails: any = null;
      if (partnerType === "shop") {
        partnerDetails = shops.find(s => s.id === partnerId);
      } else {
        partnerDetails = vehicles.find(v => v.id === partnerId);
      }

      await logAction("ASSIGN_PARTNER", `Assigned Partner ${partnerName} (ID: ${partnerId}) to Lead ${leadId}`);

      const lead = leads.find(l => l.id === leadId);
      if (lead && partnerDetails) {
        const contactNo = partnerDetails.whatsapp || partnerDetails.phone || "";
        const text = `Hello ${lead.customerName}! We have assigned ${partnerName} (Contact: ${contactNo}, Rating: ${partnerDetails.rating || '5.0'}★) to resolve your ${getServiceName(lead.serviceType)} request. You can contact them directly to coordinate. Thank you for choosing ServeGo!`;
        const whatsappLink = `https://wa.me/${lead.customerMobile.replace(/\s+/g, "")}?text=${encodeURIComponent(text)}`;
        if (window) {
          window.open(whatsappLink, "_blank");
        }
      }

      setSelectedLead(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to assign partner: " + err.message);
    }
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
        <aside className="md:w-64 shrink-0 flex flex-col gap-2 max-h-[85vh] overflow-y-auto pr-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-1.5 border-b border-border/40 mb-1">
            Home Services
          </div>
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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-1.5 border-b border-border/40 mt-4 mb-1">
            Partner Services
          </div>
          {[
            { id: "toggles", label: "Partner Toggles", icon: Settings2 },
            { id: "medical-shops", label: "Medical Shops", icon: Pill },
            { id: "grocery-shops", label: "Rasan (Grocery)", icon: ShoppingBag },
            { id: "restaurants-shops", label: "Restaurants", icon: Utensils },
            { id: "building-shops", label: "Building Materials", icon: Construction },
            { id: "centring-shops", label: "Centering Services", icon: Layers },
            { id: "hardware-shops", label: "Hardware Shops", icon: Wrench },
            { id: "vehicle-rental", label: "Vehicle Rental", icon: Car },
            { id: "partner-analytics", label: "Partner Analytics", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedLead(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </div>
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

                      {/* Recommendations Engine or Partner Confirmation */}
                      {(() => {
                        const currentService = SERVICES_LIST.find((s) => s.id === selectedLead.serviceType);
                        if (currentService?.type === "partner") {
                          const selectedShop = shops.find((s) => s.id === selectedLead.selectedPartnerId);
                          const categoryShops = shops.filter((s) => s.category === selectedLead.serviceType && s.status === "active");

                          return (
                            <div className="space-y-6">
                              {/* Selected Shop Section */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                  🏪 Customer's Selected Shop
                                </h3>
                                {selectedShop ? (
                                  <div className="p-6 border border-primary/30 bg-primary/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                      <h4 className="font-bold text-xl">{selectedShop.name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">Owner: {selectedShop.ownerName} | Contact: {selectedShop.phone}</p>
                                      <p className="text-xs text-muted-foreground">Area: {selectedShop.area} | Hours: {selectedShop.openingTime} - {selectedShop.closingTime}</p>
                                    </div>
                                    <button
                                      onClick={() => handleAssignPartner(selectedLead.id, selectedShop.id, selectedShop.name, "shop")}
                                      className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer shrink-0"
                                    >
                                      Confirm & Assign Shop
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-5 border border-dashed border-border/80 rounded-2xl text-center text-muted-foreground text-sm">
                                    No specific shop selected by the customer.
                                  </div>
                                )}
                              </div>

                              {/* Alternative Shops List */}
                              <div className="space-y-4 border-t border-border/60 pt-6">
                                <h3 className="text-base font-bold text-foreground">
                                  Assign Alternative Shop ({currentService.name})
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                  {categoryShops
                                    .filter((s) => s.id !== selectedLead.selectedPartnerId)
                                    .map((shop) => (
                                      <div key={shop.id} className="p-4 border border-border/80 rounded-2xl flex justify-between items-center bg-card hover:bg-muted/10 transition-colors">
                                        <div>
                                          <h4 className="font-bold text-sm text-foreground">{shop.name}</h4>
                                          <p className="text-xs text-muted-foreground">Area: {shop.area} | Contact: {shop.phone}</p>
                                        </div>
                                        <button
                                          onClick={() => handleAssignPartner(selectedLead.id, shop.id, shop.name, "shop")}
                                          className="px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                        >
                                          Assign This Shop
                                        </button>
                                      </div>
                                    ))}
                                  {categoryShops.filter((s) => s.id !== selectedLead.selectedPartnerId).length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No other active shops found in this category.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (currentService?.type === "vehicle") {
                          const selectedVehicle = vehicles.find((v) => v.id === selectedLead.selectedPartnerId);
                          const categoryVehicles = vehicles.filter((v) => v.category === selectedLead.serviceType && v.status === "active" && v.availability === "available");

                          return (
                            <div className="space-y-6">
                              {/* Selected Vehicle Section */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                  🚗 Customer's Selected Vehicle
                                </h3>
                                {selectedVehicle ? (
                                  <div className="p-6 border border-primary/30 bg-primary/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                      <h4 className="font-bold text-xl">{selectedVehicle.vehicleName}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">Number: {selectedVehicle.vehicleNumber} | Contact: {selectedVehicle.phone}</p>
                                      <p className="text-xs text-muted-foreground">Area: {selectedVehicle.area} | Price: ₹{selectedVehicle.price}/day</p>
                                    </div>
                                    <button
                                      onClick={() => handleAssignPartner(selectedLead.id, selectedVehicle.id, selectedVehicle.vehicleName, "vehicle")}
                                      className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer shrink-0"
                                    >
                                      Confirm & Assign Vehicle
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-5 border border-dashed border-border/80 rounded-2xl text-center text-muted-foreground text-sm">
                                    No specific vehicle selected by the customer.
                                  </div>
                                )}
                              </div>

                              {/* Alternative Vehicles List */}
                              <div className="space-y-4 border-t border-border/60 pt-6">
                                <h3 className="text-base font-bold text-foreground">
                                  Assign Alternative Available Vehicle ({currentService.name})
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                  {categoryVehicles
                                    .filter((v) => v.id !== selectedLead.selectedPartnerId)
                                    .map((vehicle) => (
                                      <div key={vehicle.id} className="p-4 border border-border/80 rounded-2xl flex justify-between items-center bg-card hover:bg-muted/10 transition-colors">
                                        <div>
                                          <h4 className="font-bold text-sm text-foreground">{vehicle.vehicleName}</h4>
                                          <p className="text-xs text-muted-foreground">Number: {vehicle.vehicleNumber} | Area: {vehicle.area} | Price: ₹{vehicle.price}/day</p>
                                        </div>
                                        <button
                                          onClick={() => handleAssignPartner(selectedLead.id, vehicle.id, vehicle.vehicleName, "vehicle")}
                                          className="px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                                        >
                                          Assign This Vehicle
                                        </button>
                                      </div>
                                    ))}
                                  {categoryVehicles.filter((v) => v.id !== selectedLead.selectedPartnerId).length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No other available vehicles found in this category.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Default: Worker recommendations engine for Home Services
                          return (
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
                          );
                        }
                      })()}
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

              {/* Tab: Partner Toggles */}
              {activeTab === "toggles" && (
                <div className="space-y-8">
                  <div className="bg-card border border-border/60 p-8 rounded-3xl shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-black">Partner & Rental Services Controls</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Control the launch states of partner-led delivery categories and vehicle rentals. When disabled, customers see a "Coming Soon" page with an interest registration form.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Local Quick Delivery and Shops Toggle */}
                      <div className="p-6 border border-border/60 rounded-2xl bg-muted/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Settings2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Local Partner Shops</h3>
                              <p className="text-xs text-muted-foreground">Medical, Grocery, Restaurants, Building, Centring, Hardware</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={toggles.localPartnerServicesEnabled}
                              onChange={(e) => handleToggleChange("localPartnerServicesEnabled", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted border border-border/60 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                          <span className="text-muted-foreground">Current Status:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${toggles.localPartnerServicesEnabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {toggles.localPartnerServicesEnabled ? "ACTIVE (Live for Booking)" : "COMING SOON (Capture Mode)"}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle Rental Toggle */}
                      <div className="p-6 border border-border/60 rounded-2xl bg-muted/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Vehicle Rental Services</h3>
                              <p className="text-xs text-muted-foreground">Sedan, SUV, Hatchback, Pickup, Mini Truck</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={toggles.vehicleRentalEnabled}
                              onChange={(e) => handleToggleChange("vehicleRentalEnabled", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted border border-border/60 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                          <span className="text-muted-foreground">Current Status:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${toggles.vehicleRentalEnabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {toggles.vehicleRentalEnabled ? "ACTIVE (Live for Booking)" : "COMING SOON (Capture Mode)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Launch interest summary card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Launch Interest Signups</span>
                      <div className="text-3xl font-black text-primary">{interests.length} registrations</div>
                      <p className="text-xs text-muted-foreground">Prospects waiting for services to launch.</p>
                    </div>
                    <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Active Partners Registered</span>
                      <div className="text-3xl font-black text-foreground">{shops.length + vehicles.length} partners</div>
                      <p className="text-xs text-muted-foreground">{shops.length} shops & {vehicles.length} vehicles configured.</p>
                    </div>
                    <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center">
                      <button
                        onClick={() => setActiveTab("partner-analytics")}
                        className="px-6 py-3 bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm w-full text-center"
                      >
                        View Launch Interest Database →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shop Categories Management */}
              {["medical-shops", "grocery-shops", "restaurants-shops", "building-shops", "centring-shops", "hardware-shops"].includes(activeTab) && (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black capitalize">
                        {activeTab.replace("-shops", " Shops").replace("restaurants-shops", "Restaurants").replace("grocery-", "Grocery (Rasan) ")} Manager
                      </h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        Manage registers, location coverage, delivery policies, and activity status.
                      </p>
                    </div>
                    {!showAddShop && (
                      <button
                        onClick={() => {
                          const tabCategoryMap: Record<string, string> = {
                            "medical-shops": "medical-shops",
                            "grocery-shops": "grocery-kirana-shops",
                            "restaurants-shops": "restaurants",
                            "building-shops": "building-material-shops",
                            "centring-shops": "centring-material-suppliers",
                            "hardware-shops": "hardware-shops"
                          };
                          setEditingShop(null);
                          setShopCategory(tabCategoryMap[activeTab] || "medical-shops");
                          setShopName("");
                          setShopOwnerName("");
                          setShopPhone("");
                          setShopWhatsapp("");
                          setShopAddress("");
                          setShopArea("");
                          setShopGoogleMapsLink("");
                          setShopOpeningTime("09:00 AM");
                          setShopClosingTime("09:00 PM");
                          setShopAvailableDays("Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
                          setShopDeliveryAvailable(true);
                          setShopDeliveryCharges("0");
                          setShopDescription("");
                          setShopRating("5.0");
                          setShopImageFiles([]);
                          setShopExistingImages([]);
                          setShopStatus("active");
                          setShowAddShop(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add New Shop
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Shop Form */}
                  {showAddShop ? (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                      <h3 className="text-lg font-black">{editingShop ? `Modify Shop Profile: ${editingShop.name}` : "Register New Shop Partner"}</h3>
                      <form onSubmit={handleSaveShop} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Shop Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apollo Pharmacy"
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Owner Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ramesh Kumar"
                              value={shopOwnerName}
                              onChange={(e) => setShopOwnerName(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Phone Number *</label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. +91 9876543210"
                              value={shopPhone}
                              onChange={(e) => setShopPhone(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">WhatsApp Number (optional, defaults to Phone)</label>
                            <input
                              type="tel"
                              placeholder="e.g. +91 9876543210"
                              value={shopWhatsapp}
                              onChange={(e) => setShopWhatsapp(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Shop Address *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Shop No 4, Main Market Road"
                              value={shopAddress}
                              onChange={(e) => setShopAddress(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Service Area Sector *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Sector 4, Gandhinagar"
                              value={shopArea}
                              onChange={(e) => setShopArea(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Google Maps Link</label>
                            <input
                              type="text"
                              placeholder="e.g. https://maps.app.goo.gl/..."
                              value={shopGoogleMapsLink}
                              onChange={(e) => setShopGoogleMapsLink(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Opening Hours</label>
                            <input
                              type="text"
                              placeholder="e.g. 09:00 AM"
                              value={shopOpeningTime}
                              onChange={(e) => setShopOpeningTime(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Closing Hours</label>
                            <input
                              type="text"
                              placeholder="e.g. 09:00 PM"
                              value={shopClosingTime}
                              onChange={(e) => setShopClosingTime(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Delivery Support</label>
                            <select
                              value={shopDeliveryAvailable ? "true" : "false"}
                              onChange={(e) => setShopDeliveryAvailable(e.target.value === "true")}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="true">Yes, Delivery Available</option>
                              <option value="false">No, Shop Pickup Only</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Delivery Charges (₹)</label>
                            <input
                              type="number"
                              disabled={!shopDeliveryAvailable}
                              placeholder="e.g. 30"
                              value={shopDeliveryCharges}
                              onChange={(e) => setShopDeliveryCharges(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Display Rating (1.0 to 5.0)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              value={shopRating}
                              onChange={(e) => setShopRating(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Working Days (Comma separated)</label>
                            <input
                              type="text"
                              value={shopAvailableDays}
                              onChange={(e) => setShopAvailableDays(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                              placeholder="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Account Status</label>
                            <select
                              value={shopStatus}
                              onChange={(e) => setShopStatus(e.target.value as any)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="active">Active (Visible to public)</option>
                              <option value="inactive">Suspended / Hidden</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground/80">Shop Short Description</label>
                          <textarea
                            rows={2}
                            placeholder="Describe products sold, brands stocked, or specialities..."
                            value={shopDescription}
                            onChange={(e) => setShopDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none"
                          />
                        </div>

                        {/* Image upload section */}
                        <div className="space-y-4 border-t border-border/60 pt-6">
                          <h4 className="text-sm font-bold text-foreground">Shop Image Catalog</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-foreground/80 block">Upload New Files</label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const filesArray = Array.from(e.target.files);
                                    const invalidSize = filesArray.some(f => f.size > 2 * 1024 * 1024);
                                    if (invalidSize) {
                                      alert("One or more files exceed the 2MB size limit.");
                                      return;
                                    }
                                    setShopImageFiles(filesArray);
                                  }
                                }}
                                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                              />
                              <p className="text-[10px] text-muted-foreground">Select multiple image files to upload. Fallback base64 conversion is active.</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground/60 block mb-2">Selected Files ({shopImageFiles.length})</span>
                              <div className="flex flex-wrap gap-2">
                                {shopImageFiles.map((file, idx) => (
                                  <div key={idx} className="text-xs bg-muted border border-border/80 px-2 py-1 rounded flex items-center gap-1">
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setShopImageFiles(shopImageFiles.filter((_, i) => i !== idx))}
                                      className="text-rose-500 hover:text-rose-700 font-bold"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Existing images list with delete triggers */}
                          {shopExistingImages.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-foreground/60 block">Existing Images</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {shopExistingImages.map((imgUrl, idx) => (
                                  <div key={idx} className="relative aspect-square rounded-xl border border-border/80 overflow-hidden bg-muted group">
                                    <img src={imgUrl} alt={`Shop img ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setShopExistingImages(shopExistingImages.filter(url => url !== imgUrl))}
                                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition-all"
                                      title="Remove this image"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Form submit handlers */}
                        <div className="flex gap-4 border-t border-border/60 pt-6">
                          <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-primary/30"
                          >
                            {editingShop ? "Update Shop Profile" : "Register Partner Shop"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddShop(false);
                              setEditingShop(null);
                            }}
                            className="px-6 py-3 border border-border/80 rounded-xl text-sm font-semibold cursor-pointer hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* Shop Registers table */
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                            <tr>
                              <th className="px-6 py-4">Shop details</th>
                              <th className="px-6 py-4">Owner / Contact</th>
                              <th className="px-6 py-4">Location Coverage</th>
                              <th className="px-6 py-4">Delivery Policy</th>
                              <th className="px-6 py-4">Rating</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(() => {
                              const tabCategoryMap: Record<string, string> = {
                                "medical-shops": "medical-shops",
                                "grocery-shops": "grocery-kirana-shops",
                                "restaurants-shops": "restaurants",
                                "building-shops": "building-material-shops",
                                "centring-shops": "centring-material-suppliers",
                                "hardware-shops": "hardware-shops"
                              };
                              const currentCategory = tabCategoryMap[activeTab];
                              const filteredShops = shops.filter(s => s.category === currentCategory);

                              return filteredShops.map((shop) => (
                                <tr key={shop.id} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center text-primary">
                                        {shop.images && shop.images.length > 0 ? (
                                          <img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <Settings2 className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-bold text-foreground">{shop.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{shop.description}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">{shop.ownerName}</div>
                                    <div className="text-xs text-muted-foreground">Ph: {shop.phone}</div>
                                    {shop.whatsapp && shop.whatsapp !== shop.phone && (
                                      <div className="text-[10px] text-emerald-600 font-semibold">WA: {shop.whatsapp}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-medium text-foreground">{shop.area}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{shop.address}</div>
                                    {shop.googleMapsLink && (
                                      <a
                                        href={shop.googleMapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                                      >
                                        Map Location <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {shop.deliveryAvailable ? (
                                      <div>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                          Delivery Supported
                                        </span>
                                        <div className="text-xs text-muted-foreground mt-1">Fee: ₹{shop.deliveryCharges}</div>
                                      </div>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                                        Pickup Only
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-amber-500 text-xs">
                                    ★ {shop.rating || "5.0"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${shop.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                      {shop.status === "active" ? "Active" : "Suspended"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                                    <button
                                      onClick={() => handleEditShopClick(shop)}
                                      className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Edit className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteShop(shop.id, shop.name)}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </td>
                                </tr>
                              ));
                            })()}
                            {shops.filter(s => {
                              const tabCategoryMap: Record<string, string> = {
                                "medical-shops": "medical-shops",
                                "grocery-shops": "grocery-kirana-shops",
                                "restaurants-shops": "restaurants",
                                "building-shops": "building-material-shops",
                                "centring-shops": "centring-material-suppliers",
                                "hardware-shops": "hardware-shops"
                              };
                              return s.category === tabCategoryMap[activeTab];
                            }).length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                  No shops registered in this category yet.
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

              {/* Vehicle Rental Management */}
              {activeTab === "vehicle-rental" && (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black">Vehicle Rental Database</h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        Register rental vehicles, assign drivers, define daily rent rates, and update real-time availability.
                      </p>
                    </div>
                    {!showAddVehicle && (
                      <button
                        onClick={() => {
                          setEditingVehicle(null);
                          setVehicleOwnerName("");
                          setVehiclePhone("");
                          setVehicleWhatsapp("");
                          setVehicleCategory("vehicle-sedan");
                          setVehicleName("");
                          setVehicleNumber("");
                          setVehicleDriverName("");
                          setVehicleArea("");
                          setVehiclePrice("");
                          setVehicleAvailability("available");
                          setVehicleImageFiles([]);
                          setVehicleExistingImages([]);
                          setVehicleStatus("active");
                          setShowAddVehicle(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow hover:shadow-primary/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Vehicle
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Vehicle Form */}
                  {showAddVehicle ? (
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                      <h3 className="text-lg font-black">{editingVehicle ? `Edit Vehicle Profile: ${editingVehicle.vehicleName}` : "Register Rental Vehicle"}</h3>
                      <form onSubmit={handleSaveVehicle} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Vehicle Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Maruti Suzuki Swift Dzire"
                              value={vehicleName}
                              onChange={(e) => setVehicleName(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">License Plate Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. BR-01-AB-1234"
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Vehicle Category *</label>
                            <select
                              value={vehicleCategory}
                              onChange={(e) => setVehicleCategory(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="vehicle-sedan">Sedan Rental</option>
                              <option value="vehicle-suv">SUV Rental</option>
                              <option value="vehicle-hatchback">Hatchback Rental</option>
                              <option value="vehicle-pickup">Pickup Truck</option>
                              <option value="vehicle-mini-truck">Mini Truck Ace</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Owner Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Anil Singh"
                              value={vehicleOwnerName}
                              onChange={(e) => setVehicleOwnerName(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Phone Number *</label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. +91 9876543210"
                              value={vehiclePhone}
                              onChange={(e) => setVehiclePhone(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">WhatsApp Number (optional)</label>
                            <input
                              type="tel"
                              placeholder="e.g. +91 9876543210"
                              value={vehicleWhatsapp}
                              onChange={(e) => setVehicleWhatsapp(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-foreground/80">Driver Name (optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Suresh Yadav (Self or Chauffeur)"
                              value={vehicleDriverName}
                              onChange={(e) => setVehicleDriverName(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Daily Rent Price (₹) *</label>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 1500"
                              value={vehiclePrice}
                              onChange={(e) => setVehiclePrice(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Service Area *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Gandhinagar, Patna"
                              value={vehicleArea}
                              onChange={(e) => setVehicleArea(e.target.value)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Transit Availability</label>
                            <select
                              value={vehicleAvailability}
                              onChange={(e) => setVehicleAvailability(e.target.value as any)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="available">Available (Free for bookings)</option>
                              <option value="unavailable">Unavailable (On duty / Out of service)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80">Registry Status</label>
                            <select
                              value={vehicleStatus}
                              onChange={(e) => setVehicleStatus(e.target.value as any)}
                              className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                            >
                              <option value="active">Active (Listed in search results)</option>
                              <option value="inactive">Suspended / Hidden</option>
                            </select>
                          </div>
                        </div>

                        {/* Image upload section */}
                        <div className="space-y-4 border-t border-border/60 pt-6">
                          <h4 className="text-sm font-bold text-foreground">Vehicle Photo Album</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-foreground/80 block">Upload Vehicle Images</label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const filesArray = Array.from(e.target.files);
                                    const invalidSize = filesArray.some(f => f.size > 2 * 1024 * 1024);
                                    if (invalidSize) {
                                      alert("One or more files exceed the 2MB size limit.");
                                      return;
                                    }
                                    setVehicleImageFiles(filesArray);
                                  }
                                }}
                                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                              />
                              <p className="text-[10px] text-muted-foreground">Select multiple image files. Compressed directly inside Firestore if storage fails.</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground/60 block mb-2">Selected Files ({vehicleImageFiles.length})</span>
                              <div className="flex flex-wrap gap-2">
                                {vehicleImageFiles.map((file, idx) => (
                                  <div key={idx} className="text-xs bg-muted border border-border/80 px-2 py-1 rounded flex items-center gap-1">
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setVehicleImageFiles(vehicleImageFiles.filter((_, i) => i !== idx))}
                                      className="text-rose-500 hover:text-rose-700 font-bold"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Existing images list */}
                          {vehicleExistingImages.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-foreground/60 block">Existing Images</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {vehicleExistingImages.map((imgUrl, idx) => (
                                  <div key={idx} className="relative aspect-square rounded-xl border border-border/80 overflow-hidden bg-muted group">
                                    <img src={imgUrl} alt={`Vehicle img ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setVehicleExistingImages(vehicleExistingImages.filter(url => url !== imgUrl))}
                                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition-all"
                                      title="Remove this image"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Form submit handlers */}
                        <div className="flex gap-4 border-t border-border/60 pt-6">
                          <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-primary/30"
                          >
                            {editingVehicle ? "Update Vehicle Details" : "Register Rental Vehicle"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddVehicle(false);
                              setEditingVehicle(null);
                            }}
                            className="px-6 py-3 border border-border/80 rounded-xl text-sm font-semibold cursor-pointer hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* Vehicles register table */
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b border-border/60">
                            <tr>
                              <th className="px-6 py-4">Vehicle Model</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Owner / Driver</th>
                              <th className="px-6 py-4">Area</th>
                              <th className="px-6 py-4">Daily Rent</th>
                              <th className="px-6 py-4">Availability</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {vehicles.map((v) => (
                              <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-6 py-4 font-bold">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center text-primary">
                                      {v.images && v.images.length > 0 ? (
                                        <img src={v.images[0]} alt={v.vehicleName} className="w-full h-full object-cover" />
                                      ) : (
                                        <Car className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-foreground">{v.vehicleName}</div>
                                      <div className="text-[10px] font-mono bg-muted border border-border/80 px-1.5 py-0.5 rounded text-muted-foreground w-fit mt-1">
                                        {v.vehicleNumber}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold capitalize text-foreground">
                                  {v.category?.replace("vehicle-", "")}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-foreground">{v.ownerName}</div>
                                  <div className="text-xs text-muted-foreground">Ph: {v.phone}</div>
                                  {v.driverName && (
                                    <div className="text-[10px] text-primary">Driver: {v.driverName}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-xs font-semibold">
                                  {v.area}
                                </td>
                                <td className="px-6 py-4 font-black text-foreground text-sm">
                                  ₹{v.price}/day
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                    v.availability === "available" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {v.availability}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                    {v.status === "active" ? "Active" : "Suspended"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 shrink-0">
                                  <button
                                    onClick={() => handleEditVehicleClick(v)}
                                    className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVehicle(v.id, v.vehicleName)}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {vehicles.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                                  No vehicles registered in the database yet.
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

              {/* Partner Services Analytics Dashboard */}
              {activeTab === "partner-analytics" && (
                <div className="space-y-8">
                  {/* Top Stats Overview Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Total Shops Registered", val: shops.length, icon: Settings2, color: "text-blue-500" },
                      { label: "Total Rental Vehicles", val: vehicles.length, icon: Car, color: "text-purple-500" },
                      { label: "Launch Interest Signups", val: interests.length, icon: Users, color: "text-amber-500" },
                      { label: "Active Live Services", val: (toggles.localPartnerServicesEnabled ? 6 : 0) + (toggles.vehicleRentalEnabled ? 5 : 0), icon: CheckCircle, color: "text-emerald-500" }
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

                  {/* Distribution list */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Launch interest distribution list */}
                    <div className="bg-card border border-border/60 p-6 rounded-2xl space-y-4">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        📊 Category Distribution Analytics
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-border/80 text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-muted/40 font-bold border-b border-border/60 text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">Category Name</th>
                              <th className="px-4 py-3 text-center">Registered Partners</th>
                              <th className="px-4 py-3 text-center">Interest Signups</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {[
                              { name: "Medical Shops", id: "medical-shops", type: "shop" },
                              { name: "Grocery / Kirana Shops", id: "grocery-kirana-shops", type: "shop" },
                              { name: "Restaurants", id: "restaurants", type: "shop" },
                              { name: "Building Material Shops", id: "building-material-shops", type: "shop" },
                              { name: "Centring Material Suppliers", id: "centring-material-suppliers", type: "shop" },
                              { name: "Hardware Shops", id: "hardware-shops", type: "shop" },
                              { name: "Sedan Rental", id: "vehicle-sedan", type: "vehicle" },
                              { name: "SUV Rental", id: "vehicle-suv", type: "vehicle" },
                              { name: "Hatchback Rental", id: "vehicle-hatchback", type: "vehicle" },
                              { name: "Pickup Rental", id: "vehicle-pickup", type: "vehicle" },
                              { name: "Mini Truck Rental", id: "vehicle-mini-truck", type: "vehicle" }
                            ].map((cat) => {
                              const partnerCount = cat.type === "shop" 
                                ? shops.filter(s => s.category === cat.id).length 
                                : vehicles.filter(v => v.category === cat.id).length;
                              const interestCount = interests.filter(i => i.serviceId === cat.id).length;

                              return (
                                <tr key={cat.id} className="hover:bg-muted/5 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-foreground">{cat.name}</td>
                                  <td className="px-4 py-3 text-center font-bold text-primary">{partnerCount}</td>
                                  <td className="px-4 py-3 text-center font-bold text-amber-600">{interestCount}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Launch Interest Registry Records */}
                    <div className="bg-card border border-border/60 p-6 rounded-2xl space-y-4">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        📋 Launch Interest Registrations ({interests.length})
                      </h3>
                      <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
                        {interests.map((interest) => (
                          <div key={interest.id} className="p-4 border border-border/80 rounded-xl space-y-2 text-xs bg-background/50 hover:border-primary/45 transition-colors">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-sm text-foreground">{interest.name}</h4>
                              <span className="text-muted-foreground text-[10px]">
                                {interest.createdAt?.seconds 
                                  ? new Date(interest.createdAt.seconds * 1000).toLocaleDateString()
                                  : "Recently"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>Mobile: <strong className="text-foreground">{interest.mobile}</strong></span>
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-black uppercase">
                                {interest.serviceName || interest.serviceId}
                              </span>
                            </div>
                          </div>
                        ))}
                        {interests.length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-12 italic">
                            No interest signups captured yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
