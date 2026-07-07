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
  Clock,
  List,
  Settings,
  Download,
  Trophy,
  Medal,
  Sparkles,
  TrendingUp,
  ShieldCheck
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
    | "waitlist"
    | "settings"
    | "performance-dashboard"
  >("overview");

  // Data State
  const [leads, setLeads] = useState<any[]>([]);
  const [workers, setWorkers] = useState<WorkerMetrics[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [wlSearch, setWlSearch] = useState("");
  const [wlCityFilter, setWlCityFilter] = useState("");
  const [wlServiceFilter, setWlServiceFilter] = useState("");
  const [wlStatusFilter, setWlStatusFilter] = useState("");
  const [wlCurrentPage, setWlCurrentPage] = useState(1);
  const [editingWlNotes, setEditingWlNotes] = useState<string | null>(null);
  const [wlNotesInput, setWlNotesInput] = useState("");
  const wlItemsPerPage = 15;

  const [toggles, setToggles] = useState<any>({
    localPartnerServicesEnabled: false,
    vehicleRentalEnabled: false,
    customerReviewsEnabled: true,
    websiteStatus: "LIVE",
    launchDate: "2026-08-16T00:00:00",
    launchMessage: "We are launching very soon in your area. Register early to claim exclusive benefits.",
    heroHeading: "Aurangabad's Smartest Home Services Platform",
    heroSubheading: "Connecting customers with verified professionals faster than ever before.",
    countdownVisibility: true,
    waitlistVisibility: true,
    citiesPlanned: 3,
    servicesPlanned: 11,
    professionalsTarget: 150
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
  const [newWorkerEmail, setNewWorkerEmail] = useState("");
  const [newWorkerPassword, setNewWorkerPassword] = useState("");

  // Add Complaint Form State
  const [complaintWorkerId, setComplaintWorkerId] = useState("");
  const [complaintBookingId, setComplaintBookingId] = useState("");
  const [complaintNotes, setComplaintNotes] = useState("");

  // Edit Worker Form State
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [editWorkerName, setEditWorkerName] = useState("");
  const [editWorkerMobile, setEditWorkerMobile] = useState("");
  const [editWorkerService, setEditWorkerService] = useState("");
  const [editWorkerArea, setEditWorkerArea] = useState("");
  const [editWorkerExp, setEditWorkerExp] = useState("");
  const [editWorkerEmail, setEditWorkerEmail] = useState("");
  const [editWorkerPassword, setEditWorkerPassword] = useState("");

  // Filters State
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [workerServiceFilter, setWorkerServiceFilter] = useState("ALL");
  const [workerAreaFilter, setWorkerAreaFilter] = useState("");

  // Complaint Filters & Management States
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("ALL");
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState("ALL");
  const [complaintWorkerFilter, setComplaintWorkerFilter] = useState("ALL");
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [complaintDateFilter, setComplaintDateFilter] = useState("ALL");
  const [tempAdminNotes, setTempAdminNotes] = useState<{ [key: string]: string }>({});

  // Top level state definitions for simulation and rewards tab to prevent React Hook violations
  const [perfSearch, setPerfSearch] = useState("");
  const [perfCategory, setPerfCategory] = useState("ALL");
  const [perfStatus, setPerfStatus] = useState("ALL");
  const [selectedSimWorker, setSelectedSimWorker] = useState<any>(null);
  
  // Milestone management states
  const [bonusAmountInput, setBonusAmountInput] = useState("");
  const [referenceNumberInput, setReferenceNumberInput] = useState("");
  const [manualExpensesInput, setManualExpensesInput] = useState("");
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [minMilestoneRatingInput, setMinMilestoneRatingInput] = useState("4.0");
  const [updatingMilestone, setUpdatingMilestone] = useState(false);

  const handleMilestoneAction = async (action: "approve" | "reject" | "pay" | "update_meta", workerId: string) => {
    setUpdatingMilestone(true);
    try {
      const response = await fetch("/api/admin/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          workerId,
          bonusAmount: parseFloat(bonusAmountInput) || 0,
          referenceNumber: referenceNumberInput,
          manualExpenses: parseFloat(manualExpensesInput) || 0,
          adminNotes: adminNotesInput
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to process request");
      }

      alert("Milestone updated successfully!");
      setBonusAmountInput("");
      setReferenceNumberInput("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const handleUpdateMinRating = async () => {
    try {
      const ref = doc(db, "system_config", "toggles");
      await updateDoc(ref, {
        minMilestoneRating: parseFloat(minMilestoneRatingInput) || 4.0
      });
      alert("Minimum rating updated successfully!");
    } catch (err: any) {
      alert("Failed to update min rating config: " + err.message);
    }
  };

  const [simRatingOffset, setSimRatingOffset] = useState(0.0);
  const [simCompletedOffset, setSimCompletedOffset] = useState(0);
  const [simRejectedOffset, setSimRejectedOffset] = useState(0);
  const [simComplaintsOffset, setSimComplaintsOffset] = useState(0);
  const [simAcceptanceRateOffset, setSimAcceptanceRateOffset] = useState(0);
  const [hofSearch, setHofSearch] = useState("");
  const [hofMonth, setHofMonth] = useState("");
  const [hofYear, setHofYear] = useState("2026");
  const [announcing, setAnnouncing] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState("");

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
              const data = docSnap.data();
              setToggles(data);
              setMinMilestoneRatingInput(String(data.minMilestoneRating ?? "4.0"));
            } else {
              setDoc(doc(db, "system_config", "toggles"), {
                localPartnerServicesEnabled: false,
                vehicleRentalEnabled: false,
                customerReviewsEnabled: true,
                minMilestoneRating: 4.0
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

        // 12. Subscribe to Waitlist Collection
        const unsubWaitlist = onSnapshot(
          collection(db, "waitlist"),
          (snap) => {
            setWaitlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (err) => console.error("Waitlist real-time listener failed:", err)
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
          unsubInterests,
          unsubWaitlist
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
  const handleToggleChange = async (key: string, value: any) => {
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
      setSaving(true);
      
      // Upload files or fallback base64
      let uploadedUrls: string[] = [...shopExistingImages];
      for (const file of shopImageFiles) {
        try {
          const fileRef = ref(storage, `shops/${Date.now()}_${file.name}`);
          await promiseWithTimeout(
            uploadBytes(fileRef, file),
            12000,
            "Image upload timed out. Try a smaller image size."
          );
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
        await promiseWithTimeout(
          updateDoc(doc(db, "shops", editingShop.id), shopDocData),
          8000,
          "Database write timed out. Please check your connection."
        );
        await logAction("EDIT_SHOP", `Edited shop ${shopName} (ID: ${editingShop.id})`);
      } else {
        await promiseWithTimeout(
          addDoc(collection(db, "shops"), {
            ...shopDocData,
            createdAt: serverTimestamp()
          }),
          8000,
          "Database write timed out. Please check your connection."
        );
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
      setSaving(false);
      alert(editingShop ? "Shop profile updated successfully!" : "New partner shop registered successfully!");
    } catch (err: any) {
      console.error(err);
      setSaving(false);
      alert("Failed to save shop: " + err.message);
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
      setSaving(true);

      let uploadedUrls: string[] = [...vehicleExistingImages];
      for (const file of vehicleImageFiles) {
        try {
          const fileRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
          await promiseWithTimeout(
            uploadBytes(fileRef, file),
            12000,
            "Image upload timed out. Try a smaller image size."
          );
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
        await promiseWithTimeout(
          updateDoc(doc(db, "vehicles", editingVehicle.id), vehicleDocData),
          8000,
          "Database write timed out. Please check your connection."
        );
        await logAction("EDIT_VEHICLE", `Edited vehicle ${vehicleName} (ID: ${editingVehicle.id})`);
      } else {
        await promiseWithTimeout(
          addDoc(collection(db, "vehicles"), {
            ...vehicleDocData,
            createdAt: serverTimestamp()
          }),
          8000,
          "Database write timed out. Please check your connection."
        );
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
      setSaving(false);
      alert(editingVehicle ? "Vehicle profile updated successfully!" : "New vehicle registered successfully!");
    } catch (err: any) {
      console.error(err);
      setSaving(false);
      alert("Failed to save vehicle: " + err.message);
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
        const whatsappLink = `https://wa.me/${formatWhatsAppNumber(lead.customerMobile)}?text=${encodeURIComponent(text)}`;
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
    if (!newWorkerName || !newWorkerMobile || !newWorkerService || !newWorkerArea || !newWorkerExp || !newWorkerPassword) return;

    try {
      const wDoc = {
        name: newWorkerName,
        mobile: newWorkerMobile,
        serviceType: newWorkerService,
        area: newWorkerArea.toLowerCase().trim(),
        experience: parseInt(newWorkerExp, 10) || 1,
        email: newWorkerEmail.trim().toLowerCase() || "",
        password: newWorkerPassword,
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
      setNewWorkerEmail("");
      setNewWorkerPassword("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Worker
  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !editWorkerName || !editWorkerMobile || !editWorkerService || !editWorkerArea || !editWorkerExp || !editWorkerPassword) return;

    try {
      const workerRef = doc(db, "workers", editingWorker.id);
      await updateDoc(workerRef, {
        name: editWorkerName,
        mobile: editWorkerMobile,
        serviceType: editWorkerService,
        area: editWorkerArea.toLowerCase().trim(),
        experience: parseInt(editWorkerExp, 10) || 1,
        email: editWorkerEmail.trim().toLowerCase() || "",
        password: editWorkerPassword,
      });

      await logAction("EDIT_WORKER", `Updated profile for worker ${editWorkerName} (ID: ${editingWorker.id})`);
      setEditingWorker(null);
      setEditWorkerEmail("");
      setEditWorkerPassword("");
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

  // Warning Worker action
  const handleWarningWorker = async (workerId: string, name: string) => {
    try {
      const workerRef = doc(db, "workers", workerId);
      const worker = workers.find(w => w.id === workerId);
      const currentWarnings = (worker as any)?.warningCount || 0;
      await updateDoc(workerRef, { warningCount: currentWarnings + 1 });
      await logAction("WORKER_WARNING", `Issued warning to worker ${name} (ID: ${workerId}). Total warnings: ${currentWarnings + 1}`);
      alert(`Warning issued to ${name}. Total warnings: ${currentWarnings + 1}`);
    } catch (err: any) {
      alert("Failed to issue warning: " + err.message);
    }
  };

  // Update Complaint Status
  const handleUpdateComplaintStatus = async (complaintId: string, status: "resolved" | "ignored", adminNotes?: string) => {
    try {
      const ref = doc(db, "complaints", complaintId);
      const updateData: any = { status };
      if (status === "resolved") {
        updateData.resolvedAt = serverTimestamp();
      }
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }
      await updateDoc(ref, updateData);
      await logAction("UPDATE_COMPLAINT_STATUS", `Marked complaint ${complaintId} as ${status.toUpperCase()}`);
      alert(`Complaint successfully marked as ${status}.`);
    } catch (err: any) {
      alert("Failed to update complaint status: " + err.message);
    }
  };

  // Update Complaint Notes
  const handleUpdateComplaintNotes = async (complaintId: string, adminNotes: string) => {
    try {
      const ref = doc(db, "complaints", complaintId);
      await updateDoc(ref, { adminNotes });
      await logAction("UPDATE_COMPLAINT_NOTES", `Updated admin notes for complaint ${complaintId}`);
      alert("Admin notes updated successfully.");
    } catch (err: any) {
      alert("Failed to update admin notes: " + err.message);
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

  // Format phone number for WhatsApp (auto-prepend 91 for Indian numbers)
  const formatWhatsAppNumber = (num: string): string => {
    let clean = num.replace(/[^\d]/g, ""); // strip all non-digits
    if (clean.startsWith("0")) clean = clean.substring(1); // remove leading 0
    if (clean.length === 10) clean = "91" + clean; // 10-digit Indian number
    return clean;
  };

  // Prefilled WhatsApp link generator for Workers
  const generateWorkerWhatsAppLink = (lead: any, worker: any) => {
    const text = `Hello ${worker.name}! You have been assigned a new ${getServiceName(lead.serviceType)} job in ${lead.customerArea}.\n\nView details & accept/reject here:\nhttps://servego.co.in/worker/job/${lead.id}/accept?token=${lead.securityToken}`;
    return `https://wa.me/${formatWhatsAppNumber(worker.mobile)}?text=${encodeURIComponent(text)}`;
  };

  // Prefilled WhatsApp link generator for Customers
  const generateCustomerWhatsAppLink = (lead: any, worker: any) => {
    const text = `Hello ${lead.customerName}! We have assigned ${worker.name} (Contact: ${worker.mobile}, Rating: ${worker.rating}★) to resolve your service request. They will contact you shortly to coordinate timing. Thank you for choosing ServeGo!`;
    return `https://wa.me/${formatWhatsAppNumber(lead.customerMobile)}?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp link generator to send worker completion proof upload page
  const generateWorkerCompletionWhatsAppLink = (lead: any, worker: any) => {
    const text = `Hello ${worker.name}! Please upload the work completion proof (photos) for your ${getServiceName(lead.serviceType)} job at ${lead.customerArea} here:\nhttps://servego.co.in/worker/job/${lead.id}/complete?token=${lead.securityToken}`;
    return `https://wa.me/${formatWhatsAppNumber(worker.mobile)}?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp link generator to send customer feedback review page
  const generateCustomerReviewWhatsAppLink = (lead: any) => {
    const text = `Hello ${lead.customerName}! Your service request for ${getServiceName(lead.serviceType)} has been completed. Please rate your experience and provide your valuable feedback here:\nhttps://servego.co.in/review/${lead.id}`;
    return `https://wa.me/${formatWhatsAppNumber(lead.customerMobile)}?text=${encodeURIComponent(text)}`;
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
            { id: "performance-dashboard", label: "Performance & Rewards", icon: Trophy },
            { id: "waitlist", label: "Pre-Launch Waitlist", icon: List, badge: waitlist.filter(w => w.status === "pending").length },
            { id: "services", label: "Services Config", icon: ClipboardList },
            { id: "complaints", label: "Complaints Tracker", icon: AlertTriangle },
            { id: "reviews", label: "Customer Reviews", icon: Star },
            { id: "revenue", label: "Assurance Revenue", icon: DollarSign },
            { id: "logs", label: "Audit Logs", icon: History },
            { id: "settings", label: "Website Settings", icon: Settings },
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
                  {/* Pending Approval Notifications banner */}
                  {workers.filter(w => w.status === "pending").length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/25 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-500 text-sm">Pending Partner Registrations</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            There are {workers.filter(w => w.status === "pending").length} new partners waiting for administrator verification before they can access their portal.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("workers")}
                        className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl shadow-md hover:scale-[1.02] transition-transform cursor-pointer border-none"
                      >
                        Go to Workers tab to Approve
                      </button>
                    </div>
                  )}

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
                          <div key={lead.id} className="p-4 border border-border/80 rounded-xl flex items-center justify-between gap-4 bg-muted/10">
                            <div>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                                {getServiceName(lead.serviceType)}
                              </span>
                              <h4 className="font-bold text-sm mt-1">{lead.customerName} - {lead.customerArea}</h4>
                              <p className="text-muted-foreground text-xs">{new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1.5 rounded-full uppercase animate-pulse">
                              Awaiting Partner
                            </span>
                          </div>
                        ))}
                        {leads.filter(l => l.status === "NEW" || l.status === "REJECTED").length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-6">All leads are currently accepted!</p>
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
                    /* Lead Details Viewer (Read-only) */
                    <div className="bg-card border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                      <div className="flex justify-between items-start border-b border-border/60 pb-6">
                        <div>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                            {getServiceName(selectedLead.serviceType)}
                          </span>
                          <h2 className="text-2xl font-black mt-1">Lead Details</h2>
                          <p className="text-muted-foreground text-sm mt-0.5">Booking ID: {selectedLead.id}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedLead(null)}
                          className="px-4 py-2 border border-border/80 rounded-xl text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
                        >
                          Back to Leads
                        </button>
                      </div>

                      {/* Lead Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60 text-sm">
                        <div className="space-y-3">
                          <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">Customer Information</h3>
                          <p><strong>Customer Name:</strong> {selectedLead.customerName}</p>
                          <p><strong>Contact Mobile:</strong> {selectedLead.customerMobile}</p>
                          <p><strong>Full Address:</strong> {selectedLead.customerAddress}</p>
                          <p><strong>Service Area:</strong> {selectedLead.customerArea}</p>
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">Booking Specifications</h3>
                          <p><strong>Assurance Fee:</strong> Paid (₹{selectedLead.appliedDiscountAmount ? selectedLead.amount : selectedLead.amount || "49"})</p>
                          <p><strong>Scheduled Date:</strong> {selectedLead.bookingDate || "Standard Schedule"}</p>
                          <p><strong>Preferred Time Slot:</strong> {selectedLead.bookingTimeSlot || "Anytime"}</p>
                          <p><strong>Status:</strong> 
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              selectedLead.status === "NEW" ? "bg-blue-100 text-blue-800" :
                              selectedLead.status === "ACCEPTED" ? "bg-purple-100 text-purple-800" :
                              selectedLead.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {selectedLead.status === "NEW" ? "Awaiting Acceptance" : selectedLead.status}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2 pt-3 border-t border-border/40 space-y-1">
                          <strong className="text-xs font-bold text-foreground uppercase tracking-wider block">Description of Work / Issue</strong>
                          <p className="text-muted-foreground whitespace-pre-wrap">{selectedLead.description}</p>
                        </div>
                      </div>

                      {/* Assigned Partner Details if exists */}
                      <div className="border-t border-border/60 pt-6">
                        <h3 className="text-lg font-black mb-4">Assigned Service Partner</h3>
                        {(() => {
                          const assignedWorker = workers.find(w => w.id === selectedLead.assignedWorkerId);
                          if (assignedWorker) {
                            return (
                              <div className="p-6 bg-muted/10 border border-border/60 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                  <h4 className="font-black text-xl text-foreground">{assignedWorker.name}</h4>
                                  <p className="text-xs text-muted-foreground">Mobile Contact: <strong>{assignedWorker.mobile}</strong></p>
                                  <p className="text-xs text-muted-foreground">Rating: <strong>{assignedWorker.rating}★</strong> | Completed Jobs: {assignedWorker.totalCompletedJobs}</p>
                                </div>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase">
                                  Job Accepted
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-8 border border-dashed border-border/80 rounded-2xl text-center text-muted-foreground bg-muted/5">
                                No partner has accepted this booking request yet. Eligible partners in the category are receiving notification alerts.
                              </div>
                            );
                          }
                        })()}
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
                                      <button
                                         onClick={() => {
                                           setSelectedLead(lead);
                                           setActiveTab("leads");
                                         }}
                                         className="px-3 py-1.5 border border-border/80 hover:bg-muted text-foreground font-bold text-xs rounded-lg cursor-pointer"
                                       >
                                         View Details
                                       </button>
                                      
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
                                      
                                      {/* WhatsApp to Worker: Request Proof */}
                                      {lead.status === "ACCEPTED" && assignedWorker && (
                                        <a
                                          href={generateWorkerCompletionWhatsAppLink(lead, assignedWorker)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
                                          title="Send Job Completion Upload Link to Worker"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" /> Request Proof
                                        </a>
                                      )}

                                      {/* WhatsApp to Customer: Request Review */}
                                      {lead.status === "COMPLETED" && (
                                        <a
                                          href={generateCustomerReviewWhatsAppLink(lead)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors ml-2"
                                          title="Send Feedback Review Link to Customer"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" /> Request Review
                                        </a>
                                      )}

                                      {/* View completion photo */}
                                      {lead.status === "COMPLETED" && (lead.completionPhotoUrl || lead.completionPhoto) && (
                                        <a
                                          href={lead.completionPhotoUrl || lead.completionPhoto}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="email"
                            placeholder="Partner Login Email (Optional)"
                            value={newWorkerEmail}
                            onChange={(e) => setNewWorkerEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm font-semibold"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Partner Login Password"
                            value={newWorkerPassword}
                            onChange={(e) => setNewWorkerPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm font-semibold"
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
                            {(services.length > 0 ? services : SERVICES_LIST).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="email"
                            placeholder="Partner Login Email (Optional)"
                            value={editWorkerEmail}
                            onChange={(e) => setEditWorkerEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm font-semibold"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Partner Login Password"
                            value={editWorkerPassword}
                            onChange={(e) => setEditWorkerPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm font-semibold"
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
                        {(services.length > 0 ? services : SERVICES_LIST).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                    <div className="flex items-center gap-3">
                                      {worker.imageUrl ? (
                                        <img 
                                          src={worker.imageUrl} 
                                          alt={worker.name} 
                                          className="w-10 h-10 rounded-full border border-border object-cover bg-muted shrink-0" 
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0">
                                          {worker.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-semibold text-foreground">{worker.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{worker.mobile}</div>
                                      </div>
                                    </div>
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
                                        worker.status === "active" ? "bg-emerald-100 text-emerald-800" :
                                        worker.status === "pending" ? "bg-amber-100 text-amber-800 animate-pulse" :
                                        "bg-rose-100 text-rose-800"
                                      }`}>
                                        {worker.status}
                                      </span>
                                      <span className="block text-[10px] text-muted-foreground">
                                        Act: {actStatus}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2 font-medium">
                                    <button
                                      onClick={() => {
                                        setEditingWorker(worker);
                                        setEditWorkerName(worker.name);
                                        setEditWorkerMobile(worker.mobile);
                                        setEditWorkerService(worker.serviceType);
                                        setEditWorkerArea(worker.area);
                                        setEditWorkerExp(worker.experience.toString());
                                        setEditWorkerEmail((worker as any).email || "");
                                        setEditWorkerPassword((worker as any).password || "");
                                      }}
                                      className="px-2.5 py-1.5 border border-border/80 hover:bg-muted text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Edit
                                    </button>

                                    {worker.status === "pending" ? (
                                      <button
                                        onClick={() => handleWorkerStatusChange(worker.id, worker.name, "active")}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer animate-pulse"
                                      >
                                        Approve Partner
                                      </button>
                                    ) : worker.status === "active" ? (
                                      <button
                                        onClick={() => handleWorkerStatusChange(worker.id, worker.name, "suspended")}
                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Suspend
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleWorkerStatusChange(worker.id, worker.name, "active")}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Reactivate
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

              {/* Tab: Performance & Rewards Dashboard (Admin Control) */}
              {activeTab === "performance-dashboard" && (() => {
                // Calculate dynamics across all workers
                const activeWorkers = workers.filter(w => w.status !== "removed") as any[];

                // Financial calculations
                const totalRevenueGenerated = activeWorkers.reduce((acc, w) => acc + ((w.totalCompletedJobs || 0) * 99), 0);
                
                const totalBonusesPaid = activeWorkers.reduce((acc, w) => {
                  const history = w.milestoneHistory || [];
                  const wPaid = history.reduce((sum: number, h: any) => sum + (h.bonusAmount || 0), 0);
                  return acc + wPaid;
                }, 0);

                const totalPendingBonuses = activeWorkers.reduce((acc, w) => {
                  if (w.milestoneStatus && ["pending_review", "approved", "withdrawal_requested", "payment_processing"].includes(w.milestoneStatus)) {
                    return acc + (w.milestoneBonusAmount || 0);
                  }
                  return acc;
                }, 0);

                const totalExpenses = activeWorkers.reduce((acc, w) => acc + (w.manualExpenses || 0), 0);
                const netProfitGenerated = totalRevenueGenerated - totalBonusesPaid - totalPendingBonuses - totalExpenses;

                // Filtered workers list
                const filteredWorkers = activeWorkers.filter((w: any) => {
                  const matchSearch = w.name.toLowerCase().includes(perfSearch.toLowerCase()) || w.mobile.includes(perfSearch);
                  const matchCategory = perfCategory === "ALL" || w.serviceType === perfCategory;
                  
                  // Status filter
                  let matchStatus = true;
                  if (perfStatus !== "ALL") {
                    matchStatus = w.milestoneStatus === perfStatus;
                  }
                  
                  return matchSearch && matchCategory && matchStatus;
                });

                return (
                  <div className="space-y-8 animate-in fade-in duration-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">ServeGo Milestone Rewards & Profit Analytics</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          Review milestone payout requests, log operational expenses, and analyze real-time platform earnings.
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Statistics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: "Platform Gross Revenue", value: `₹${totalRevenueGenerated}`, icon: Trophy, color: "text-amber-500" },
                        { label: "Bonuses Paid (CONFIDENTIAL)", value: `₹${totalBonusesPaid}`, icon: ShieldCheck, color: "text-emerald-500" },
                        { label: "Pending Milestone Payouts", value: `₹${totalPendingBonuses}`, icon: Medal, color: "text-indigo-500" },
                        { label: "Estimated Net Profit", value: `₹${netProfitGenerated}`, icon: Users, color: "text-blue-500" }
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              <span>{item.label}</span>
                              <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <h4 className="text-2xl font-black">{item.value}</h4>
                          </div>
                        );
                      })}
                    </div>

                    {/* Config Row */}
                    <div className="bg-card border border-border/60 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-foreground tracking-wider">Milestone Quality Gate</h4>
                        <p className="text-[10px] text-muted-foreground">Define the minimum average rating needed for workers to claim milestone bonus rewards.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input 
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={minMilestoneRatingInput}
                            onChange={(e) => setMinMilestoneRatingInput(e.target.value)}
                            className="bg-muted border border-border rounded-xl px-4 py-2 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary text-center font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 font-mono">★</span>
                        </div>
                        <button
                          onClick={handleUpdateMinRating}
                          className="px-4 py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-md cursor-pointer border-none"
                        >
                          Update Quality Gate
                        </button>
                      </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left Panel: Workers Table */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-primary" /> Active Service Partners
                            </h3>
                          </div>
                          
                          {/* Search Filters Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="text"
                                value={perfSearch}
                                onChange={(e) => setPerfSearch(e.target.value)}
                                placeholder="Search partner name or mobile..."
                                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                              />
                            </div>
                            
                            <select
                              value={perfCategory}
                              onChange={(e) => setPerfCategory(e.target.value)}
                              className="bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
                            >
                              <option value="ALL">All Categories</option>
                              {SERVICES_LIST.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </select>

                            <select
                              value={perfStatus}
                              onChange={(e) => setPerfStatus(e.target.value)}
                              className="bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
                            >
                              <option value="ALL">All Payout States</option>
                              <option value="in_progress">In Progress</option>
                              <option value="pending_review">Pending Review</option>
                              <option value="approved">Approved</option>
                              <option value="withdrawal_requested">Withdrawal Requested</option>
                              <option value="paid">Paid Successfully</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>

                          {/* Table UI */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-muted/30 font-bold uppercase text-[9px] text-muted-foreground border-b border-border/50">
                                <tr>
                                  <th className="px-4 py-2">Worker</th>
                                  <th className="px-4 py-2 text-center">Milestone</th>
                                  <th className="px-4 py-2 text-center">Jobs Progress</th>
                                  <th className="px-4 py-2 text-center">Rating</th>
                                  <th className="px-4 py-2 text-right">Payout Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {filteredWorkers.map((row: any) => {
                                  const milestoneTarget = row.currentMilestone || 100;
                                  const milestoneJobs = row.milestoneCompletedJobs || 0;
                                  const milestoneStatus = row.milestoneStatus || "in_progress";
                                  const rating = row.rating || 5.0;

                                  return (
                                    <tr 
                                      key={row.id} 
                                      onClick={() => {
                                        setSelectedSimWorker(row);
                                        setBonusAmountInput(row.milestoneBonusAmount ? String(row.milestoneBonusAmount) : "");
                                        setReferenceNumberInput(row.milestonePaymentDetails?.referenceNumber || "");
                                        setManualExpensesInput(row.manualExpenses ? String(row.manualExpenses) : "");
                                        setAdminNotesInput(row.adminNotes || "");
                                      }}
                                      className={`hover:bg-muted/10 transition-colors cursor-pointer ${
                                        selectedSimWorker?.id === row.id ? "bg-primary/5" : ""
                                      }`}
                                    >
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-foreground">{row.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{getServiceName(row.serviceType)} • {row.mobile}</div>
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold">{milestoneTarget} Jobs</td>
                                      <td className="px-4 py-3 text-center font-mono font-bold">
                                        <span className={milestoneJobs >= milestoneTarget ? "text-emerald-500" : "text-foreground"}>
                                          {milestoneJobs} / {milestoneTarget}
                                        </span>
                                      </td>
                                      <td className={`px-4 py-3 text-center font-bold ${rating >= (toggles.minMilestoneRating ?? 4.0) ? "text-amber-500" : "text-rose-500"}`}>
                                        {rating.toFixed(1)} ★
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                          milestoneStatus === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                                          milestoneStatus === "withdrawal_requested" ? "bg-purple-500/10 text-purple-500" :
                                          milestoneStatus === "approved" ? "bg-indigo-500/10 text-indigo-500" :
                                          milestoneStatus === "pending_review" ? "bg-yellow-500/10 text-yellow-500 animate-pulse" :
                                          milestoneStatus === "rejected" ? "bg-rose-500/10 text-rose-500" :
                                          "bg-neutral-500/10 text-neutral-500"
                                        }`}>
                                          {milestoneStatus.replace("_", " ")}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Custom Financial Distribution Chart */}
                        <div className="bg-card border border-border/60 p-5 rounded-3xl shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Estimated Financial Distribution</h4>
                          <div className="w-full h-48 flex items-end gap-6 pt-6 font-mono text-[10px] text-muted-foreground border-b border-border/50 pb-2">
                            {[
                              { label: "Gross Revenue", value: totalRevenueGenerated, color: "bg-blue-500" },
                              { label: "Paid Bonuses", value: totalBonusesPaid, color: "bg-indigo-500" },
                              { label: "Pending Payouts", value: totalPendingBonuses, color: "bg-purple-500" },
                              { label: "Logged Expenses", value: totalExpenses, color: "bg-rose-500" },
                              { label: "Estimated Net Profit", value: netProfitGenerated, color: "bg-emerald-500 font-bold" }
                            ].map((bar, idx) => {
                              const maxVal = Math.max(100, totalRevenueGenerated, totalBonusesPaid, totalPendingBonuses, totalExpenses, netProfitGenerated);
                              const heightPct = `${Math.max(8, (bar.value / maxVal) * 100)}%`;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                  <span className="font-bold text-foreground">₹{bar.value}</span>
                                  <div className="w-full rounded-t-xl transition-all duration-500 relative group overflow-hidden" style={{ height: heightPct }}>
                                    <div className={`absolute inset-0 ${bar.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                  </div>
                                  <span className="font-sans font-bold text-[9px] uppercase tracking-wider text-center">{bar.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right Panel: Selected Worker Detail & Decision Support */}
                      <div className="space-y-6">
                        {selectedSimWorker ? (() => {
                          const wDetail = workers.find(x => x.id === selectedSimWorker.id) || selectedSimWorker;
                          const completedJobs = wDetail.totalCompletedJobs || 0;
                          const grossRevenue = completedJobs * 99;
                          
                          // Sum worker historical bonus amount
                          const workerHistory = wDetail.milestoneHistory || [];
                          const workerPaidBonus = workerHistory.reduce((sum: number, h: any) => sum + (h.bonusAmount || 0), 0);
                          const workerPendingBonus = ["pending_review", "approved", "withdrawal_requested", "payment_processing"].includes(wDetail.milestoneStatus) ? (wDetail.milestoneBonusAmount || 0) : 0;
                          
                          const workerExpenses = parseFloat(manualExpensesInput) || wDetail.manualExpenses || 0;
                          const workerNetProfit = grossRevenue - workerPaidBonus - workerPendingBonus - workerExpenses;

                          return (
                            <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-5 shadow-sm">
                              <div className="border-b border-border/50 pb-3">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Decision Support Panel</span>
                                <h4 className="font-black text-sm text-primary mt-1">{wDetail.name}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{getServiceName(wDetail.serviceType)} • {wDetail.mobile}</p>
                              </div>

                              {/* Profit Calculator Card */}
                              <div className="p-4 bg-muted/30 border border-border/70 rounded-2xl space-y-3">
                                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Partner Profit Analytics</h5>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Gross Revenue (₹99/job):</span>
                                    <strong className="text-foreground">₹{grossRevenue}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Paid Bonuses (CONFIDENTIAL):</span>
                                    <strong className="text-indigo-500">₹{workerPaidBonus}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pending Bonuses:</span>
                                    <strong className="text-purple-500">₹{workerPendingBonus}</strong>
                                  </div>
                                  <div className="flex justify-between border-t border-border/50 pt-2 font-bold text-foreground">
                                    <span>Estimated Net Profit:</span>
                                    <span className="text-emerald-500">₹{workerNetProfit}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Operations adjustments */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Operational Adjustment</h5>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">Manual Expenses Log (₹)</label>
                                    <input 
                                      type="number"
                                      value={manualExpensesInput}
                                      onChange={(e) => setManualExpensesInput(e.target.value)}
                                      placeholder="e.g. 500 (Refunds / compensations)"
                                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">Administrative Notes</label>
                                    <textarea 
                                      value={adminNotesInput}
                                      onChange={(e) => setAdminNotesInput(e.target.value)}
                                      placeholder="Audit logs, payout details, complaints note..."
                                      rows={2}
                                      className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleMilestoneAction("update_meta", wDetail.id)}
                                    disabled={updatingMilestone}
                                    className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl border border-border/80 cursor-pointer"
                                  >
                                    Save Adjustment Notes
                                  </button>
                                </div>
                              </div>

                              {/* Bonus Management Actions */}
                              <div className="border-t border-border/50 pt-4 space-y-3">
                                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Milestone Actions</h5>
                                
                                {wDetail.milestoneStatus === "pending_review" && (
                                  <div className="space-y-3 animate-in fade-in">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-muted-foreground">Set Bonus Amount (₹) *</label>
                                      <input 
                                        type="number"
                                        value={bonusAmountInput}
                                        onChange={(e) => setBonusAmountInput(e.target.value)}
                                        placeholder="e.g. 3000"
                                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-bold"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleMilestoneAction("reject", wDetail.id)}
                                        disabled={updatingMilestone}
                                        className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow cursor-pointer border-none"
                                      >
                                        Reject Request
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!bonusAmountInput) {
                                            alert("Please set a bonus amount.");
                                            return;
                                          }
                                          handleMilestoneAction("approve", wDetail.id);
                                        }}
                                        disabled={updatingMilestone}
                                        className="py-2.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow cursor-pointer border-none"
                                      >
                                        Approve Milestone
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {wDetail.milestoneStatus === "approved" && (
                                  <p className="text-[10px] text-indigo-500 italic font-bold text-center py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                                    Milestone approved. Waiting for partner to submit withdrawal bank / UPI details.
                                  </p>
                                )}

                                {wDetail.milestoneStatus === "withdrawal_requested" && wDetail.milestoneWithdrawalDetails && (
                                  <div className="space-y-3.5 animate-in fade-in bg-purple-500/5 border border-purple-500/10 p-3.5 rounded-2xl">
                                    <div className="space-y-1.5 text-[11px] text-foreground">
                                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Withdrawal Method: {wDetail.milestoneWithdrawalDetails.method.toUpperCase()}</span>
                                      
                                      {wDetail.milestoneWithdrawalDetails.method === "upi" ? (
                                        <p><strong>UPI ID:</strong> <span className="font-mono">{wDetail.milestoneWithdrawalDetails.upiId}</span></p>
                                      ) : (
                                        <div className="space-y-1 font-mono text-[10px]">
                                          <p><strong>Holder:</strong> {wDetail.milestoneWithdrawalDetails.holderName}</p>
                                          <p><strong>Bank:</strong> {wDetail.milestoneWithdrawalDetails.bankName}</p>
                                          <p><strong>A/C:</strong> {wDetail.milestoneWithdrawalDetails.accountNumber}</p>
                                          <p><strong>IFSC:</strong> {wDetail.milestoneWithdrawalDetails.ifsc}</p>
                                        </div>
                                      )}
                                      
                                      <p className="border-t border-border/30 pt-1.5 font-bold">Approved Bonus Amount: <span className="text-primary font-mono">₹{wDetail.milestoneBonusAmount}</span></p>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                      <label className="text-[10px] font-bold text-muted-foreground">Payment Reference Number *</label>
                                      <input 
                                        type="text"
                                        value={referenceNumberInput}
                                        onChange={(e) => setReferenceNumberInput(e.target.value)}
                                        placeholder="e.g. TXN1827492749"
                                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-bold"
                                      />
                                    </div>

                                    <button
                                      onClick={() => {
                                        if (!referenceNumberInput) {
                                          alert("Reference number is required to close transfer transaction.");
                                          return;
                                        }
                                        handleMilestoneAction("pay", wDetail.id);
                                      }}
                                      disabled={updatingMilestone}
                                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow cursor-pointer border-none"
                                    >
                                      Approve & Mark Paid Successfully
                                    </button>
                                  </div>
                                )}

                                {wDetail.milestoneStatus === "paid" && (
                                  <p className="text-[10px] text-emerald-500 font-bold text-center py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                    ✓ Milestone Paid Successfully. TXN Ref: {wDetail.milestonePaymentDetails?.referenceNumber || "N/A"}
                                  </p>
                                )}

                                {(!wDetail.milestoneStatus || wDetail.milestoneStatus === "in_progress") && (
                                  <p className="text-[10px] text-muted-foreground italic text-center py-2 bg-muted/40 rounded-xl">
                                    Milestone target in progress. Active milestone is {wDetail.currentMilestone || 100} Jobs.
                                  </p>
                                )}
                              </div>

                              {/* Milestone History list */}
                              <div className="border-t border-border/50 pt-4 space-y-2">
                                <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Milestone History</h5>
                                {workerHistory.length === 0 ? (
                                  <p className="text-[10px] text-muted-foreground italic">No historical payouts registered.</p>
                                ) : (
                                  <div className="space-y-1.5 font-mono text-[9px] text-muted-foreground">
                                    {workerHistory.map((h: any, i: number) => (
                                      <div key={i} className="flex justify-between py-1 border-b border-border/20">
                                        <span>{h.milestone} Jobs Milestone</span>
                                        <span className="text-emerald-500 font-bold">₹{h.bonusAmount || "CONFIDENTIAL"} (PAID)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            Click on a service partner from the left list to load metric calculations and payment audit panel.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tab 4: Complaints */}
              {activeTab === "complaints" && (() => {
                const filteredComplaints = complaints.filter((comp) => {
                  if (complaintSearchQuery.trim()) {
                    const q = complaintSearchQuery.trim().toLowerCase();
                    const bId = comp.bookingId?.toLowerCase() || "";
                    if (!bId.includes(q)) return false;
                  }
                  if (complaintStatusFilter !== "ALL") {
                    const status = comp.status || "pending";
                    if (status !== complaintStatusFilter) return false;
                  }
                  if (complaintCategoryFilter !== "ALL") {
                    if (comp.serviceType !== complaintCategoryFilter) return false;
                  }
                  if (complaintWorkerFilter !== "ALL") {
                    if (comp.workerId !== complaintWorkerFilter) return false;
                  }
                  if (complaintDateFilter !== "ALL") {
                    if (!comp.createdAt?.seconds) return false;
                    const diffMs = Date.now() - (comp.createdAt.seconds * 1000);
                    if (complaintDateFilter === "today" && diffMs > 24 * 60 * 60 * 1000) return false;
                    if (complaintDateFilter === "week" && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
                    if (complaintDateFilter === "month" && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
                  }
                  return true;
                });

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-black">Complaint Management Center</h2>
                        <p className="text-muted-foreground text-xs mt-0.5">Track, audit, and resolve customer and internal complaints.</p>
                      </div>
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

                    {/* Filters Section */}
                    <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                          <select
                            value={complaintStatusFilter}
                            onChange={(e) => setComplaintStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/50 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="ALL">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="ignored">Ignored</option>
                          </select>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                          <select
                            value={complaintCategoryFilter}
                            onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/50 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="ALL">All Categories</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Worker Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Partner</label>
                          <select
                            value={complaintWorkerFilter}
                            onChange={(e) => setComplaintWorkerFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/50 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="ALL">All Partners</option>
                            {workers.map((w) => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date Filter */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Range</label>
                          <select
                            value={complaintDateFilter}
                            onChange={(e) => setComplaintDateFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/50 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="ALL">All Time</option>
                            <option value="today">Last 24 Hours</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                          </select>
                        </div>

                        {/* Search Booking ID */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search ID</label>
                          <input
                            type="text"
                            placeholder="Booking ID..."
                            value={complaintSearchQuery}
                            onChange={(e) => setComplaintSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/50 border border-border/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Complaint Cards Grid */}
                    <div className="space-y-4">
                      {filteredComplaints.map((item) => {
                        const status = item.status || "pending";
                        const wStatus = workers.find(w => w.id === item.workerId)?.status || "active";
                        const warningCount = (workers.find(w => w.id === item.workerId) as any)?.warningCount || 0;

                        return (
                          <div key={item.id} className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Complaint File</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    status === "pending" ? "bg-rose-100 text-rose-700 animate-pulse" :
                                    status === "resolved" ? "bg-emerald-100 text-emerald-800" :
                                    "bg-slate-100 text-slate-700"
                                  }`}>
                                    {status}
                                  </span>
                                </div>
                                <h3 className="font-black text-base text-foreground">{item.reason || "Internal Logged Violation"}</h3>
                                <p className="text-xs text-muted-foreground font-mono">Booking ID: {item.bookingId}</p>
                              </div>

                              <div className="text-right text-xs text-muted-foreground">
                                <p>Filed: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : "Recently"}</p>
                                {item.resolvedAt && (
                                  <p className="text-emerald-600">Resolved: {new Date(item.resolvedAt.seconds * 1000).toLocaleDateString()}</p>
                                )}
                                {item.workerResponseTime && (
                                  <p className="text-indigo-600">Worker response time: {item.workerResponseTime}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                              {/* Left column: Customer Details */}
                              <div className="space-y-2.5">
                                <h4 className="font-bold text-foreground/80 uppercase tracking-wide text-[10px]">Customer Details</h4>
                                <div className="space-y-1 text-muted-foreground">
                                  <p><strong>Name:</strong> {item.customerName || "ServeGo Client"}</p>
                                  <p><strong>Mobile:</strong> {item.customerMobile || "N/A"}</p>
                                  <p><strong>Address:</strong> {item.customerAddress || "N/A"}</p>
                                </div>
                              </div>

                              {/* Right column: Worker details */}
                              <div className="space-y-2.5">
                                <h4 className="font-bold text-foreground/80 uppercase tracking-wide text-[10px]">Assigned Worker Details</h4>
                                <div className="space-y-1 text-muted-foreground">
                                  <p><strong>Name:</strong> {item.workerName} (ID: {item.workerId?.substring(0, 8)}...)</p>
                                  <p><strong>Mobile:</strong> {item.workerMobile || "N/A"}</p>
                                  <p><strong>Category:</strong> {getServiceName(item.serviceType)}</p>
                                  <p>
                                    <strong>Worker Status: </strong>
                                    <span className={`font-black uppercase ${wStatus === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                                      {wStatus}
                                    </span>
                                    {` (Warnings: ${warningCount})`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Complaint photos & description */}
                            <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed border-border">
                              <p className="text-xs text-foreground font-semibold">Complaint Details & Evidence</p>
                              <p className="text-xs text-muted-foreground leading-relaxed italic">"{item.description || "No text description details provided."}"</p>
                              {item.photos && item.photos.length > 0 && (
                                <div className="flex gap-2 flex-wrap pt-1">
                                  {item.photos.map((p: string, idx: number) => (
                                    <a key={idx} href={p} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-border/80 hover:scale-105 transition-transform">
                                      <img src={p} alt="" className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Admin Notes Section */}
                            <div className="space-y-2.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Internal Notes</label>
                              <div className="flex gap-2">
                                <textarea
                                  placeholder="Add details, notes, calls tracking description..."
                                  value={tempAdminNotes[item.id] !== undefined ? tempAdminNotes[item.id] : item.adminNotes || ""}
                                  onChange={(e) => setTempAdminNotes({ ...tempAdminNotes, [item.id]: e.target.value })}
                                  className="flex-1 px-3 py-2 bg-muted/40 border border-border/80 rounded-xl text-xs focus:outline-none resize-none"
                                  rows={1}
                                />
                                <button
                                  onClick={() => handleUpdateComplaintNotes(item.id, tempAdminNotes[item.id] || "")}
                                  className="px-4 py-2 bg-secondary border border-border/80 hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs cursor-pointer"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                              {status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateComplaintStatus(item.id, "resolved")}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
                                  >
                                    Close & Resolve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateComplaintStatus(item.id, "ignored")}
                                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
                                  >
                                    Ignore Complaint
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleWarningWorker(item.workerId, item.workerName)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs cursor-pointer border-none"
                              >
                                Warn Partner
                              </button>
                              {wStatus === "active" ? (
                                <button
                                  onClick={() => handleWorkerStatusChange(item.workerId, item.workerName, "suspended")}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
                                >
                                  Suspend Partner
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleWorkerStatusChange(item.workerId, item.workerName, "active")}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none"
                                >
                                  Reactivate Partner
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {filteredComplaints.length === 0 && (
                        <div className="bg-card border border-border/60 p-8 rounded-3xl text-center text-muted-foreground text-sm font-semibold">
                          No matching complaints found!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      {/* Local Quick Delivery and Shops Toggle */}
                      <div className="p-6 border border-border/60 rounded-2xl bg-muted/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Settings2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Local Partner Shops</h3>
                              <p className="text-xs text-muted-foreground">Medical, Grocery, Centring, Hardware</p>
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
                              <p className="text-xs text-muted-foreground">Sedan, SUV, Hatchback, Pickup</p>
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

                      {/* Customer Reviews Toggle */}
                      <div className="p-6 border border-border/60 rounded-2xl bg-muted/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Reviews Showcase</h3>
                              <p className="text-xs text-muted-foreground">Toggle customer reviews visibility on main page</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={toggles.customerReviewsEnabled ?? true}
                              onChange={(e) => handleToggleChange("customerReviewsEnabled", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted border border-border/60 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                          <span className="text-muted-foreground">Current Status:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${(toggles.customerReviewsEnabled ?? true) ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {(toggles.customerReviewsEnabled ?? true) ? "VISIBLE ON WEBSITE" : "HIDDEN ON WEBSITE"}
                          </span>
                        </div>
                      </div>

                      {/* Complaint Window Toggle Card */}
                      <div className="p-6 border border-border/60 rounded-2xl bg-muted/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Complaint Window</h3>
                              <p className="text-xs text-muted-foreground">Active customer complaint window (days)</p>
                            </div>
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={toggles.complaintWindowDays ?? 5}
                            onChange={(e) => handleToggleChange("complaintWindowDays", Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
                            className="w-16 px-3 py-1.5 bg-background border border-border/80 rounded-xl text-center text-sm font-bold focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                          <span className="text-muted-foreground">Current Config:</span>
                          <span className="font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {toggles.complaintWindowDays ?? 5} Days Period
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
                              type="text"
                              disabled={!shopDeliveryAvailable}
                              placeholder="e.g. 30"
                              value={shopDeliveryCharges}
                              onChange={(e) => setShopDeliveryCharges(e.target.value.replace(/[^0-9.]/g, ''))}
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
                            disabled={saving}
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-primary/30 disabled:opacity-60 flex items-center gap-2"
                          >
                            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {saving ? "Saving..." : (editingShop ? "Update Shop Profile" : "Register Partner Shop")}
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
                        </div>

                        {/* Daily Rent Price — full width row */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground/80">Daily Rent Price (₹) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="e.g. 1500"
                            value={vehiclePrice}
                            onChange={(e) => setVehiclePrice(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                          />
                        </div>

                        {/* Service Area — full width row */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground/80">Service Area *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Gandhinagar, Patna"
                            value={vehicleArea}
                            onChange={(e) => setVehicleArea(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                          />
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
                            disabled={saving}
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-primary/30 disabled:opacity-60 flex items-center gap-2"
                          >
                            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {saving ? "Saving..." : (editingVehicle ? "Update Vehicle Details" : "Register Rental Vehicle")}
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
              {/* Pre-Launch Waitlist Manager Panel */}
              {activeTab === "waitlist" && (() => {
                // Filter and paginate waitlist
                const filteredWaitlist = waitlist
                  .filter((w) => {
                    const searchLower = wlSearch.toLowerCase();
                    const matchSearch =
                      !wlSearch ||
                      (w.name || "").toLowerCase().includes(searchLower) ||
                      (w.mobile || "").toLowerCase().includes(searchLower);
                    
                    const matchCity =
                      !wlCityFilter ||
                      (w.city || "").toLowerCase().includes(wlCityFilter.toLowerCase());
                    
                    const matchService =
                      !wlServiceFilter || w.interestedService === wlServiceFilter;
                    
                    const matchStatus =
                      !wlStatusFilter || (w.status || "pending") === wlStatusFilter;

                    return matchSearch && matchCity && matchService && matchStatus;
                  })
                  .sort((a, b) => (b.waitlistPosition || 0) - (a.waitlistPosition || 0));

                const totalWlItems = filteredWaitlist.length;
                const totalWlPages = Math.ceil(totalWlItems / wlItemsPerPage) || 1;
                const paginatedWaitlist = filteredWaitlist.slice(
                  (wlCurrentPage - 1) * wlItemsPerPage,
                  wlCurrentPage * wlItemsPerPage
                );

                // Extract unique cities for filtering dropdown
                const uniqueCities = Array.from(new Set(waitlist.map(w => w.city || "").filter(Boolean)));

                return (
                  <div className="space-y-8">
                    {/* Waitlist Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-black text-foreground">Pre-Launch Waitlist Database</h2>
                        <p className="text-xs text-muted-foreground mt-1">Review registrations, manage follow-up contact status, and analyze pre-launch leads.</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          const headers = ["Position", "Full Name", "Mobile Number", "City", "Area", "Service ID", "Status", "IP Address", "Device", "Browser", "Referred By", "Referrals", "Notes", "Registration Date"];
                          const rows = filteredWaitlist.map(w => [
                            w.waitlistPosition || "",
                            w.name || "",
                            w.mobile || "",
                            w.city || "",
                            w.area || "",
                            w.interestedService || "",
                            w.status || "pending",
                            w.ip || "unknown",
                            w.device || "unknown",
                            w.browser || "unknown",
                            w.referredBy || "",
                            w.referralCount || 0,
                            w.notes || "",
                            w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000).toLocaleString() : ""
                          ]);
                          const csvContent = "data:text/csv;charset=utf-8," 
                            + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `servego_waitlist_${Date.now()}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        disabled={filteredWaitlist.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#E06D3E] text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:opacity-90 disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Waitlist CSV
                      </button>
                    </div>

                    {/* Waitlist Dashboard Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          label: "Total Registrations", 
                          val: waitlist.length, 
                          icon: Users, 
                          color: "text-blue-500" 
                        },
                        { 
                          label: "Today's Signups", 
                          val: waitlist.filter(w => {
                            if (!w.createdAt?.seconds) return false;
                            const d = new Date(w.createdAt.seconds * 1000);
                            const today = new Date();
                            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                          }).length, 
                          icon: Clock, 
                          color: "text-emerald-500" 
                        },
                        { 
                          label: "Most Requested Service", 
                          val: (() => {
                            if (waitlist.length === 0) return "None";
                            const counts: any = {};
                            waitlist.forEach(w => { counts[w.interestedService] = (counts[w.interestedService] || 0) + 1; });
                            const sorted = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
                            const matched = SERVICES_LIST.find(s => s.id === sorted[0]);
                            return matched ? matched.name : (sorted[0] || "None");
                          })(), 
                          icon: ClipboardList, 
                          color: "text-[#E06D3E]" 
                        },
                        { 
                          label: "Top Waitlist City", 
                          val: (() => {
                            if (waitlist.length === 0) return "None";
                            const counts: any = {};
                            waitlist.forEach(w => { counts[w.city] = (counts[w.city] || 0) + 1; });
                            const sorted = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
                            return sorted[0] || "None";
                          })(), 
                          icon: MapPin, 
                          color: "text-indigo-500" 
                        }
                      ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                          <div key={idx} className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</span>
                              <Icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div className="text-xl font-black truncate">{stat.val}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Search & Filter Options Bar */}
                    <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Search Name / Mobile</label>
                        <input 
                          type="text"
                          value={wlSearch}
                          onChange={(e) => { setWlSearch(e.target.value); setWlCurrentPage(1); }}
                          placeholder="e.g. Shubham"
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter by City</label>
                        <select
                          value={wlCityFilter}
                          onChange={(e) => { setWlCityFilter(e.target.value); setWlCurrentPage(1); }}
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-foreground"
                        >
                          <option value="">All Cities</option>
                          {uniqueCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter by Service</label>
                        <select
                          value={wlServiceFilter}
                          onChange={(e) => { setWlServiceFilter(e.target.value); setWlCurrentPage(1); }}
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-foreground"
                        >
                          <option value="">All Services</option>
                          {SERVICES_LIST.map(srv => (
                            <option key={srv.id} value={srv.id}>{srv.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter by Status</label>
                        <select
                          value={wlStatusFilter}
                          onChange={(e) => { setWlStatusFilter(e.target.value); setWlCurrentPage(1); }}
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-foreground"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                        </select>
                      </div>
                    </div>

                    {/* Waitlist grid/table manager */}
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-wrap gap-4 items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Registered Waitlist Members ({filteredWaitlist.length} shown)</span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-muted/40 font-bold border-b border-border/60 text-muted-foreground">
                            <tr>
                              <th className="px-6 py-3.5">Pos</th>
                              <th className="px-6 py-3.5">Name</th>
                              <th className="px-6 py-3.5">Contact Details</th>
                              <th className="px-6 py-3.5">Location</th>
                              <th className="px-6 py-3.5">Interested Service</th>
                              <th className="px-6 py-3.5">Referral Details</th>
                              <th className="px-6 py-3.5">IP & Device</th>
                              <th className="px-6 py-3.5">Date Joined</th>
                              <th className="px-6 py-3.5">Notes</th>
                              <th className="px-6 py-3.5">Status</th>
                              <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {paginatedWaitlist.map((w) => {
                              const srv = SERVICES_LIST.find(s => s.id === w.interestedService);
                              return (
                                <tr key={w.id} className="hover:bg-muted/5 transition-colors">
                                  <td className="px-6 py-4 font-black text-[#E06D3E]">#{w.waitlistPosition}</td>
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-foreground">{w.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">{w.mobile}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">{w.city}</div>
                                    <div className="text-[10px] text-muted-foreground">{w.area || "No Area specified"}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                      {srv ? srv.name : w.interestedService}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-foreground">{w.referralCount || 0} Invites</div>
                                    {w.referredBy && (
                                      <div className="text-[10px] text-muted-foreground">Referred by: {w.referredBy}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-foreground">{w.ip || "unknown"}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase">{w.device || "unknown"} • {w.browser || "unknown"}</div>
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground">
                                    {w.createdAt?.seconds 
                                      ? new Date(w.createdAt.seconds * 1000).toLocaleString() 
                                      : "Just now"}
                                  </td>
                                  <td className="px-6 py-4">
                                    {editingWlNotes === w.mobile ? (
                                      <div className="flex gap-1.5 items-center">
                                        <input 
                                          type="text"
                                          value={wlNotesInput}
                                          onChange={(e) => setWlNotesInput(e.target.value)}
                                          className="px-2 py-1 border border-border rounded text-[11px] bg-muted/40 text-foreground w-[120px] focus:outline-none"
                                          placeholder="Add note..."
                                        />
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateDoc(doc(db, "waitlist", w.mobile), { notes: wlNotesInput });
                                              setEditingWlNotes(null);
                                            } catch (e: any) {
                                              alert("Failed to save note: " + e.message);
                                            }
                                          }}
                                          className="px-2 py-1 bg-[#E06D3E] text-white rounded text-[10px] font-bold cursor-pointer"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          setEditingWlNotes(w.mobile);
                                          setWlNotesInput(w.notes || "");
                                        }}
                                        className="text-muted-foreground italic cursor-pointer hover:text-foreground hover:underline truncate max-w-[130px]"
                                        title="Click to edit notes"
                                      >
                                        {w.notes || "Add note..."}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const nextStatus = w.status === "contacted" ? "pending" : "contacted";
                                          await updateDoc(doc(db, "waitlist", w.mobile), { status: nextStatus });
                                        } catch (e: any) {
                                          alert("Failed to toggle status: " + e.message);
                                        }
                                      }}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                                        w.status === "contacted" 
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                          : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {w.status || "pending"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Remove ${w.name} from the waitlist?`)) {
                                          try {
                                            await deleteDoc(doc(db, "waitlist", w.mobile));
                                          } catch (e: any) {
                                            alert("Failed to delete entry: " + e.message);
                                          }
                                        }
                                      }}
                                      className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                                      title="Remove User"
                                    >
                                      <Trash2 className="w-4 h-4 inline" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredWaitlist.length === 0 && (
                              <tr>
                                <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground italic bg-background/50">
                                  No waitlist registrations found matching the filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalWlPages > 1 && (
                        <div className="p-4 border-t border-border/60 flex items-center justify-between bg-muted/10">
                          <span className="text-xs text-muted-foreground">
                            Showing {(wlCurrentPage - 1) * wlItemsPerPage + 1} to {Math.min(wlCurrentPage * wlItemsPerPage, totalWlItems)} of {totalWlItems} entries
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setWlCurrentPage(p => Math.max(1, p - 1))}
                              disabled={wlCurrentPage === 1}
                              className="px-3 py-1 bg-card border border-border/80 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer text-foreground"
                            >
                              Previous
                            </button>
                            <span className="text-xs font-bold px-2 py-1 text-foreground">
                              Page {wlCurrentPage} of {totalWlPages}
                            </span>
                            <button
                              onClick={() => setWlCurrentPage(p => Math.min(totalWlPages, p + 1))}
                              disabled={wlCurrentPage === totalWlPages}
                              className="px-3 py-1 bg-card border border-border/80 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer text-foreground"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Website Settings Tab Panel */}
              {activeTab === "settings" && (
                <div className="space-y-8 max-w-4xl">
                  <div>
                    <h2 className="text-xl font-black text-foreground">Global Platform Settings</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure launch metrics, website modes, and countdown dates in real-time.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        setSaving(true);
                        await updateDoc(doc(db, "system_config", "toggles"), {
                          websiteStatus: toggles.websiteStatus,
                          launchDate: toggles.launchDate,
                          launchMessage: toggles.launchMessage,
                          heroHeading: toggles.heroHeading,
                          heroSubheading: toggles.heroSubheading,
                          countdownVisibility: toggles.countdownVisibility,
                          waitlistVisibility: toggles.waitlistVisibility,
                          citiesPlanned: parseInt(toggles.citiesPlanned, 10) || 0,
                          servicesPlanned: parseInt(toggles.servicesPlanned, 10) || 0,
                          professionalsTarget: parseInt(toggles.professionalsTarget, 10) || 0
                        });
                        setSaving(false);
                        alert("Global platform settings updated successfully!");
                      } catch (err: any) {
                        setSaving(false);
                        alert("Failed to save config: " + err.message);
                      }
                    }}
                    className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
                  >
                    
                    {/* Website status mode toggle */}
                    <div className="space-y-2 border-b border-border/60 pb-6">
                      <label className="text-sm font-bold text-foreground block">Global Website Status Mode *</label>
                      <div className="flex gap-6 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs">
                          <input 
                            type="radio" 
                            name="websiteStatus" 
                            value="LIVE"
                            checked={toggles.websiteStatus === "LIVE"}
                            onChange={(e) => setToggles((prev: any) => ({ ...prev, websiteStatus: "LIVE" }))}
                            className="w-4 h-4 accent-primary" 
                          />
                          <span>ACTIVE / LIVE (Normal website is visible to public)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs">
                          <input 
                            type="radio" 
                            name="websiteStatus" 
                            value="PRE_LAUNCH"
                            checked={toggles.websiteStatus === "PRE_LAUNCH"}
                            onChange={(e) => setToggles((prev: any) => ({ ...prev, websiteStatus: "PRE_LAUNCH" }))}
                            className="w-4 h-4 accent-primary" 
                          />
                          <span className="text-amber-600 font-bold">PRE-LAUNCH MODE (All traffic redirects to waitlist landing page)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Launch date configuration */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80">Launch Date & Time (ISO 8601)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 2026-08-16T00:00:00"
                          value={toggles.launchDate}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, launchDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                        />
                      </div>

                      {/* Stats targets config */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80">Planned Cities Target</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={toggles.citiesPlanned}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, citiesPlanned: e.target.value }))}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80">Available Services Target</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={toggles.servicesPlanned}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, servicesPlanned: e.target.value }))}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80">Verified Professionals Target</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={toggles.professionalsTarget}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, professionalsTarget: e.target.value }))}
                          className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/80">Launch Message Alert Banner</label>
                      <textarea 
                        rows={2}
                        value={toggles.launchMessage}
                        onChange={(e) => setToggles((prev: any) => ({ ...prev, launchMessage: e.target.value }))}
                        className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/80">Pre-Launch Hero Heading</label>
                      <input 
                        type="text" 
                        required
                        value={toggles.heroHeading}
                        onChange={(e) => setToggles((prev: any) => ({ ...prev, heroHeading: e.target.value }))}
                        className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/80">Pre-Launch Hero Subheading</label>
                      <textarea 
                        rows={2}
                        required
                        value={toggles.heroSubheading}
                        onChange={(e) => setToggles((prev: any) => ({ ...prev, heroSubheading: e.target.value }))}
                        className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-xl focus:outline-none text-sm resize-none"
                      />
                    </div>

                    <div className="flex gap-8 border-t border-border/60 pt-6">
                      <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs">
                        <input 
                          type="checkbox" 
                          checked={toggles.countdownVisibility}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, countdownVisibility: e.target.checked }))}
                          className="w-4.5 h-4.5 rounded accent-primary cursor-pointer"
                        />
                        <span>Enable Countdown Clock widget</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs">
                        <input 
                          type="checkbox" 
                          checked={toggles.waitlistVisibility}
                          onChange={(e) => setToggles((prev: any) => ({ ...prev, waitlistVisibility: e.target.checked }))}
                          className="w-4.5 h-4.5 rounded accent-primary cursor-pointer"
                        />
                        <span>Enable Waitlist Registration Form</span>
                      </label>
                    </div>

                    <div className="flex gap-4 border-t border-border/60 pt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer shadow hover:shadow-primary/30 disabled:opacity-60 flex items-center gap-2 uppercase tracking-wider"
                      >
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {saving ? "Saving Configurations..." : "Save Platform Configurations"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
