import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ImpactGalleryAdmin from "../components/ImpactGalleryAdmin.jsx";
import SuccessStoriesAdmin from "../components/SuccessStoriesAdmin.jsx";
import NewsAdmin from "../components/NewsAdmin.jsx";
import BloodRequestBackgroundAdmin from "../components/BloodRequestBackgroundAdmin.jsx";
import HomeContentAdmin from "../components/HomeContentAdmin.jsx";
import AdminBloodBanks from "../components/AdminBloodBanks.jsx";
import AdminBloodBankRequests from "../components/AdminBloodBankRequests.jsx";
import adminService from "../services/adminService";
import campService from "../services/campService";
import donorService from "../services/donorService";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// CSS migrated to Tailwind


// Date Helper Functions
const toDate = (dateString) => dateString ? new Date(dateString) : null;
const isUpcoming = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d >= today;
};
const isSoon = (date, days) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffTime = d.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};
const daysUntil = (date) => {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffTime = d.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const Admin = () => {
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" | "camps" | "users" | "enquiries" | "organizers"
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [donors, setDonors] = useState([]);
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [showQR, setShowQR] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [loadingCamps, setLoadingCamps] = useState(false);

  const [organizersList, setOrganizersList] = useState([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  // --- Blood Requests States ---
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loadingBloodRequests, setLoadingBloodRequests] = useState(false);
  const [totalPlatformUsers, setTotalPlatformUsers] = useState(0);
  const [brFilterState, setBrFilterState] = useState("");
  const [brFilterBloodGroup, setBrFilterBloodGroup] = useState("");
  const [brFilterStatus, setBrFilterStatus] = useState("");
  const [brSearchQuery, setBrSearchQuery] = useState("");
  const [notifyingId, setNotifyingId] = useState(null);

  // Donor Edit states
  const [editDonorId, setEditDonorId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Camp Edit states
  const [editCampId, setEditCampId] = useState(null);
  const [editCampForm, setEditCampForm] = useState({});

  const [newCamp, setNewCamp] = useState({
    name: "",
    location: "",
    date: "",
    organizerId: "",
    organizerName: "",
    organizerContact: "",
    proName: "",
    hospitalName: "",
  });

  const [campQuery, setCampQuery] = useState("");
  const [onlyComingSoon, setOnlyComingSoon] = useState(false);
  const [upcomingSort, setUpcomingSort] = useState("date-asc");
  const [doneSort, setDoneSort] = useState("date-desc");
  const [allSort, setAllSort] = useState("date-desc");
  const [tab, setTab] = useState("all");

  // Add Camp Modal
  const [showAddCampModal, setShowAddCampModal] = useState(false);

  // --- Enquiries States ---
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquiriesTab, setEnquiriesTab] = useState("pending");
  const [enquiryQuery, setEnquiryQuery] = useState("");
  const [passwordById, setPasswordById] = useState({});
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [resetEnquiryModal, setResetEnquiryModal] = useState(null);
  const [newEnquiryPassword, setNewEnquiryPassword] = useState("");
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [editEnquiryForm, setEditEnquiryForm] = useState({});

  // --- Organizers Page States ---
  const [editOrganizerId, setEditOrganizerId] = useState(null);
  const [editOrganizerForm, setEditOrganizerForm] = useState({});

  // --- Camp Photos States ---
  const [photosCampId, setPhotosCampId] = useState(null);
  const [photosCampObj, setPhotosCampObj] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [campPhotosFiles, setCampPhotosFiles] = useState(null);

  // --- UI/UX Customizer States ---
  const [homeBgType, setHomeBgType] = useState(() => localStorage.getItem("homeBgType") || "gradient");
  const [homeBgUrl, setHomeBgUrl] = useState(() => localStorage.getItem("homeBgUrl") || "");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setHomeBgUrl(data.fileUrl);
        toast.success("File uploaded successfully! Click 'Save Theme Settings' to apply.");
      } else {
        toast.error("Upload failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file. Make sure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUIUX = async () => {
    try {
      localStorage.setItem("homeBgType", homeBgType);
      localStorage.setItem("homeBgUrl", homeBgUrl);

      const response = await fetch("/api/admin/theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bgType: homeBgType, bgUrl: homeBgUrl }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("UI/UX background updated successfully on server! Visit the Home page to see the changes.");
      } else {
        toast.error("Saved to local storage, but server database save failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Saved to local storage, but server connection failed.");
    }
  };

  const fetchThemeSettings = async () => {
    try {
      const response = await fetch("/api/admin/theme");
      const data = await response.json();
      if (data) {
        setHomeBgType(data.bgType || "gradient");
        setHomeBgUrl(data.bgUrl || "");
      }
    } catch (err) {
      console.error("Failed to load server theme settings:", err);
    }
  };

  const navigate = useNavigate();
  const token = localStorage.getItem("admin-token");

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }
    fetchCamps();
    fetchOrganizersList();
    fetchEnquiries();
    fetchThemeSettings();
    fetchBloodRequests();
    fetchTotalUsers();
  }, []);

  const fetchTotalUsers = async () => {
    try {
      const count = await adminService.getTotalUsers();
      setTotalPlatformUsers(count || 0);
    } catch (err) {
      console.error("Failed to load total users", err);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingAllUsers(true);
    try {
      const data = await adminService.getAllUsers();
      setAllUsers(data || []);
    } catch (err) {
      console.error("Failed to load all users", err);
    } finally {
      setLoadingAllUsers(false);
    }
  };

  useEffect(() => {
    if (currentView === "all-users") fetchAllUsers();
  }, [currentView]);

  const fetchBloodRequests = async (filters = {}) => {
    setLoadingBloodRequests(true);
    try {
      const params = {};
      if (filters.state) params.state = filters.state;
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      if (filters.status) params.status = filters.status;
      const data = await adminService.getBloodRequests(params);
      setBloodRequests(data || []);
    } catch (err) {
      console.error("Failed to load blood requests", err);
    } finally {
      setLoadingBloodRequests(false);
    }
  };

  const handleNotifyDonors = async (reqId) => {
    if (!window.confirm("Re-notify all matching donors and blood banks?")) return;
    setNotifyingId(reqId);
    try {
      const res = await adminService.notifyBloodRequest(reqId);
      if (res.success) {
        toast.success(`Notified ${res.notifiedCount ?? ""} donors/banks!`);
      } else {
        toast.error(res.message || "Notification failed");
      }
    } catch (err) {
      toast.error("Error sending notifications");
    } finally {
      setNotifyingId(null);
    }
  };

  // --- Organizers Methods ---
  const fetchOrganizersList = async () => {
    setLoadingOrganizers(true);
    try {
      const data = await adminService.getOrganizers();
      setOrganizersList(data || []);
    } catch (err) {
      console.error("Failed to load organizers", err);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const handleOrganizerSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setNewCamp({
        ...newCamp,
        organizerId: "",
        organizerName: "",
        organizerContact: "",
      });
      return;
    }

    const org = organizersList.find((o) => o._id === selectedId);
    if (org) {
      setNewCamp({
        ...newCamp,
        organizerId: org._id,
        organizerName: org.name,
        organizerContact: org.phone,
      });
    }
  };

  const handleEditOrganizerClick = (org) => {
    setEditOrganizerId(org._id);
    setEditOrganizerForm({
      name: org.name,
      phone: org.phone,
      isActive: org.isActive,
    });
  };

  const handleOrganizerFormChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setEditOrganizerForm({ ...editOrganizerForm, [e.target.name]: value });
  };

  const handleSaveOrganizer = async (id) => {
    try {
      await adminService.updateOrganizer(id, editOrganizerForm);
      setOrganizersList((prev) =>
        prev.map((org) => (org._id === id ? { ...org, ...editOrganizerForm } : org))
      );
      setEditOrganizerId(null);
      toast.success("Organizer updated successfully!");
    } catch (err) {
      toast.error("Error updating organizer");
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await adminService.deleteOrganizer(id);
      setOrganizersList((prev) => prev.filter((org) => org._id !== id));
      toast.success("Deleted successfully!");
    } catch (err) {
      toast.error("Error deleting organizer");
    }
  };

  // --- Enquiries Methods ---
  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const data = await adminService.getEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load enquiries", err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm("Permanently delete this enquiry?")) return;
    try {
      await adminService.deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openEditEnquiryModal = (enquiry) => {
    setEditingEnquiry(enquiry);
    setEditEnquiryForm({
      organizerName: enquiry.organizerName,
      email: enquiry.email,
      phone: enquiry.phone,
      campName: enquiry.campName,
      campDate: enquiry.campDate ? enquiry.campDate.split("T")[0] : "",
      campLocation: enquiry.campLocation,
      hospitalName: enquiry.hospitalName,
      message: enquiry.message,
    });
  };

  const handleEditEnquiryChange = (e) => {
    setEditEnquiryForm({ ...editEnquiryForm, [e.target.name]: e.target.value });
  };

  const saveEditEnquiry = async () => {
    try {
      const data = await adminService.updateEnquiry(editingEnquiry._id, editEnquiryForm);
      setEnquiries((prev) =>
        prev.map((e) => (e._id === editingEnquiry._id ? data.enquiry : e))
      );
      setEditingEnquiry(null);
      toast.success("Enquiry Details Updated!");
    } catch (err) {
      toast.error("Failed to update enquiry");
    }
  };

  const approveEnquiry = async (enquiryId) => {
    const pw = (passwordById[enquiryId] || "").trim();
    if (!window.confirm("Approve this enquiry?")) return;

    try {
      const data = await adminService.approveEnquiry(enquiryId, pw);
      if (data.type === "existing_user") {
        toast.success("Approved (Existing User).\nCamp assigned.\nUser logs in with OLD password.");
      } else {
        toast.success(`Approved (New User).\nEmail: ${data.organizerLogin.email}\nPassword: ${data.organizerLogin.password}`);
      }
      fetchEnquiries();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed");
    }
  };

  const resetEnquiryPassword = async () => {
    if (!newEnquiryPassword.trim()) {
      toast.error("Please enter new password");
      return;
    }

    try {
      await adminService.resetOrganizerPassword(resetEnquiryModal._id, newEnquiryPassword);
      toast.success("Password updated successfully");
      setResetEnquiryModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update password");
    }
  };

  const rejectEnquiry = async (enquiryId) => {
    const reason = (rejectReasonById[enquiryId] || "").trim();
    if (!reason) return toast.error("Please enter rejection reason");
    if (!window.confirm("Reject this enquiry?")) return;

    try {
      await adminService.rejectEnquiry(enquiryId, reason);
      toast.success("Rejected");
      fetchEnquiries();
    } catch (err) {
      toast.error("Reject failed");
    }
  };

  const filteredEnquiries = useMemo(() => {
    let data = [...enquiries];
    if (enquiriesTab !== "all") data = data.filter((e) => e.status === enquiriesTab);
    const query = enquiryQuery.trim().toLowerCase();
    if (query) {
      data = data.filter((e) =>
        [e.organizerName, e.email, e.phone, e.organizationName, e.area, e.organizationType]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [enquiries, enquiriesTab, enquiryQuery]);

  // --- Camps & Donors Logic ---
  useEffect(() => {
    if (selectedCamp) fetchDonors();
  }, [selectedCamp]);

  const fetchCamps = async () => {
    setLoadingCamps(true);
    try {
      const data = await campService.getCampsWithCount();
      const campsData = data || [];
      setCamps(campsData);
      if (!selectedCamp) {
        setSelectedCamp("all");
      }
    } catch (err) {
      console.error("Failed to fetch camps:", err.response || err);
      setCamps([]);
      if ([401, 403].includes(err.response?.status)) handleLogout();
    } finally {
      setLoadingCamps(false);
    }
  };

  const fetchDonors = async () => {
    if (!selectedCamp) return;
    setLoadingDonors(true);
    try {
      let data;
      if (selectedCamp === "all") {
        data = await donorService.getAllDonors();
      } else {
        data = await donorService.getDonorsByCamp(selectedCamp);
      }
      setDonors(data || []);
    } catch (err) {
      console.error("Failed to fetch donors:", err.response || err);
      setDonors([]);
      if ([401, 403].includes(err.response?.status)) handleLogout();
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    navigate("/admin-login");
  };

  const handleNewCampChange = (e) => {
    setNewCamp({ ...newCamp, [e.target.name]: e.target.value });
  };

  const handleNewCampSubmit = async (e) => {
    e.preventDefault();
    try {
      await campService.createCamp(newCamp);
      setNewCamp({
        name: "",
        location: "",
        date: "",
        organizerName: "",
        organizerContact: "",
        proName: "",
        hospitalName: "",
      });
      fetchCamps();
      setShowAddCampModal(false);
      toast.success("Camp added successfully!");
    } catch (err) {
      console.error(err.response || err);
      toast.error(err?.response?.data?.message || "Error adding camp.");
    }
  };

  const handleEditCampClick = (camp) => {
    setEditCampId(camp._id);
    setEditCampForm({
      name: camp.name || "",
      location: camp.location || "",
      date: camp.date ? camp.date.slice(0, 10) : "",
      organizerName: camp.organizerName || "",
      organizerContact: camp.organizerContact || "",
      proName: camp.proName || "",
      hospitalName: camp.hospitalName || "",
      status: camp.status || "upcoming",
    });
  };

  const handleEditCampChange = (e) => {
    setEditCampForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditCampSave = async (id) => {
    try {
      await campService.updateCamp(id, editCampForm);
      setEditCampId(null);
      await fetchCamps();
      toast.success("Camp updated successfully!");
    } catch (err) {
      console.error(err.response || err);
      toast.error(err?.response?.data?.message || "Error updating camp");
    }
  };

  const handleDeleteCamp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this camp?")) return;
    try {
      await campService.deleteCamp(id);
      if (selectedCamp === id) {
        setSelectedCamp(null);
        setDonors([]);
      }
      await fetchCamps();
      toast.success("Camp deleted successfully!");
    } catch (err) {
      console.error(err.response || err);
      toast.error(err?.response?.data?.message || "Error deleting camp");
    }
  };

  const handleDeleteDonor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this donor?")) return;
    try {
      await donorService.deleteDonor(id);
      await fetchDonors();
      await fetchCamps();
      toast.success("Donor deleted successfully!");
    } catch (err) {
      console.error(err.response || err);
      toast.error(err?.response?.data?.message || "Error deleting donor");
    }
  };

  const handleEditClick = (donor) => {
    setEditDonorId(donor._id);
    setEditForm({ ...donor });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      await donorService.updateDonor(id, editForm);
      setDonors((prev) =>
        prev.map((d) => (d._id === id ? { ...editForm } : d))
      );
      setEditDonorId(null);
    } catch (err) {
      console.error(err.response || err);
      toast.error(err?.response?.data?.message || "Error saving donor update");
    }
  };

  const downloadPDF = () => {
    if (!donors.length) return toast.error("No donors to export.");
    const doc = new jsPDF();

    const camp = camps.find((c) => c._id === selectedCamp);
    const campName = camp?.name || "All Camps";

    doc.setFontSize(16);
    doc.text(`Donor List for Camp: ${campName}`, 14, 15);

    let startY = 22;
    doc.setFontSize(11);

    if (camp) {
      const campLines = [
        `Date: ${camp.date ? new Date(camp.date).toLocaleDateString() : "N/A"}`,
        `Location: ${camp.location || "N/A"}`,
        `Organizer: ${camp.organizerName || "N/A"} (${camp.organizerContact || "N/A"
        })`,
        `PRO: ${camp.proName || "N/A"}`,
        `Hospital: ${camp.hospitalName || "N/A"}`,
        `Camp ID: ${camp._id}`,
      ];
      campLines.forEach((line, i) => doc.text(line, 14, startY + i * 6));
      startY += campLines.length * 6 + 4;
    } else {
      doc.text("Camps: All", 14, startY);
      startY += 10;
    }

    const tableColumn = [
      "#",
      "Name",
      "Blood Group",
      "Age",
      "Weight (kg)",
      "Email",
      "Phone",
      "Address",
      "Remark",
    ];

    const tableRows = donors.map((donor, index) => [
      index + 1,
      donor.name ?? "",
      donor.bloodGroup ?? "",
      donor.age ?? "",
      donor.weight ?? "",
      donor.email ?? "",
      donor.phone ?? "",
      donor.address ?? "",
      donor.remark ?? "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY,
      styles: { fontSize: 9 },
    });

    doc.save(`DonorList_${campName}.pdf`);
  };

  const totalDonorsAcrossCamps = useMemo(() => {
    return camps.reduce(
      (sum, c) => sum + (typeof c.donorCount === "number" ? c.donorCount : 0),
      0
    );
  }, [camps]);

  const totalDonations = useMemo(() => {
    return camps.reduce((sum, c) => sum + (c.donorCount || c.totalUnitsCollected || c.totalDonors || 0), 0);
  }, [camps]);

  const bloodGroupStats = useMemo(() => {
    const counts = { "O+": 0, "A+": 0, "B+": 0, "AB+": 0, "O-": 0, "Others": 0 };
    let total = 0;
    allUsers.forEach((d) => {
      const bg = d.bloodGroup;
      if (counts[bg] !== undefined) {
        counts[bg]++;
        total++;
      } else if (bg) {
        counts["Others"]++;
        total++;
      }
    });

    const list = Object.keys(counts).map((key, index) => {
      const count = counts[key];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const colors = ["#ff2e4b", "#ef4444", "#3b82f6", "#8b5cf6", "#f59e0b", "#6b7280"];
      return {
        label: key,
        count,
        percentage: pct,
        color: colors[index],
      };
    });

    return { list, total };
  }, [allUsers]);

  // Sorting and Filtering for Camps
  const applySearch = (list) => {
    const q = campQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const s = [
        c?.name,
        c?.location,
        c?.hospitalName,
        c?.organizerName,
        c?.organizerContact,
        c?.proName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return s.includes(q);
    });
  };

  const upcomingCamps = useMemo(() => {
    let list = camps.filter((c) => isUpcoming(toDate(c?.date)));
    if (onlyComingSoon) list = list.filter((c) => isSoon(toDate(c?.date), 7));
    list = applySearch(list);
    list.sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return upcomingSort === "date-asc" ? da - db : db - da;
    });
    return list;
  }, [camps, onlyComingSoon, campQuery, upcomingSort]);

  const doneCamps = useMemo(() => {
    let list = camps.filter((c) => !isUpcoming(toDate(c?.date)));
    list = applySearch(list);
    list.sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return doneSort === "date-desc" ? db - da : da - db;
    });
    return list;
  }, [camps, campQuery, doneSort]);

  const allCampsList = useMemo(() => {
    let list = applySearch([...camps]);
    list.sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return allSort === "date-desc" ? db - da : da - db;
    });
    return list;
  }, [camps, campQuery, allSort]);

  const whenBadge = (date) => {
    const d = toDate(date);
    if (!d) return null;
    const du = daysUntil(d);
    const whenLabel =
      du < 0
        ? "Done"
        : du === 0
          ? "Today"
          : du === 1
            ? "Tomorrow"
            : `In ${du} days`;
    const cls =
      du < 0
        ? "bg-secondary"
        : du <= 3
          ? "bg-warning text-dark"
          : "bg-light text-dark";
    return <span className={`badge ${cls}`}>{whenLabel}</span>;
  };

  const renderDonutChart = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    return (
      <svg viewBox="0 0 140 140" className="donut-svg">
        <g transform="rotate(-90 70 70)">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
          {bloodGroupStats.list.map((bg) => {
            if (bg.percentage === 0) return null;
            const strokeLength = (bg.percentage / 100) * circumference;
            const offset = currentOffset;
            currentOffset += strokeLength;

            return (
              <circle
                key={bg.label}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={bg.color}
                strokeWidth="12"
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <text x="70" y="68" textAnchor="middle" className="donut-center-text">
          {bloodGroupStats.total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="donut-center-subtext">
          Total
        </text>
      </svg>
    );
  };

  const handleManagePhotosClick = (camp) => {
    setPhotosCampId(camp._id);
    setPhotosCampObj(camp);
    setCampPhotosFiles(null);
  };

  const handleCampPhotosUpload = async (e) => {
    e.preventDefault();
    if (!campPhotosFiles || campPhotosFiles.length === 0) return toast.error("Please select at least one photo");
    
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      Array.from(campPhotosFiles).forEach(file => {
        formData.append("photos", file);
      });
      
      const res = await campService.uploadCampPhotos(photosCampId, formData);
      if (res.success) {
        toast.success("Photos uploaded successfully!");
        setPhotosCampObj(prev => ({ ...prev, photos: res.photos }));
        fetchCamps();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
      setCampPhotosFiles(null);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <style>{`
        /* Local Premium Styles for Admin Panel */
        .dashboard-wrapper {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background-color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }
        .sidebar {
          width: 260px;
          background-color: #0f172a;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          flex-shrink: 0;
          border-right: 1px solid #1e293b;
          box-shadow: 4px 0 25px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .sidebar.collapsed {
          width: 80px;
          padding: 1.5rem 0.5rem;
        }
        .sidebar.collapsed .brand-name,
        .sidebar.collapsed .brand-subtitle,
        .sidebar.collapsed .menu-section-title,
        .sidebar.collapsed .menu-item-text,
        .sidebar.collapsed .emergency-btn {
          display: none;
        }
        .sidebar.collapsed .brand-container {
          justify-content: center;
          padding: 0;
        }
        .sidebar.collapsed .menu-item {
          justify-content: center;
          padding: 0.75rem;
        }
        .sidebar.collapsed .menu-item-icon {
          font-size: 1.25rem;
        }
        .brand-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }
        .brand-logo {
          font-size: 2rem;
          animation: pulse-heart 2.5s infinite;
        }
        .brand-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.05em;
          font-family: 'Cinzel', serif;
        }
        .brand-name span {
          color: #e11d48;
        }
        .brand-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .menu-section {
          margin-bottom: 1.5rem;
        }
        .menu-section-title {
          padding: 0 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #cbd5e1;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .menu-item:hover {
          background-color: #1e293b;
          color: #ffffff;
        }
        .menu-item.active {
          background-color: #e11d48;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35);
        }
        .menu-item-icon {
          font-size: 1.1rem;
        }
        .emergency-button-container {
          margin-top: auto;
          padding-top: 1rem;
        }
        .emergency-btn {
          width: 100%;
          padding: 0.75rem;
          background-color: #ef4444;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
          transition: all 0.2s ease;
        }
        .emergency-btn:hover {
          background-color: #dc2626;
          transform: translateY(-2px);
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .toggle-sidebar-btn {
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #64748b;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }
        .toggle-sidebar-btn:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .search-container {
          display: flex;
          align-items: center;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          width: 320px;
          transition: all 0.2s ease;
        }
        .search-container:focus-within {
          border-color: #cbd5e1;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }
        .search-icon {
          margin-right: 0.5rem;
          color: #94a3b8;
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.85rem;
          color: #334155;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .icon-badge-btn {
          position: relative;
          font-size: 1.25rem;
          color: #64748b;
          cursor: pointer;
          transition: color 0.2s;
          background: #f8fafc;
          padding: 0.4rem;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-badge-btn:hover {
          color: #e11d48;
          background: #fff1f2;
        }
        .badge-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background-color: #e11d48;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
        }
        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 1.5rem;
          border-left: 1px solid #e2e8f0;
        }
        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e293b;
        }
        .user-role {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 500;
        }
        .welcome-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }
        .welcome-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.25rem;
          font-family: 'Cinzel', serif;
        }
        .welcome-subtitle {
          font-size: 0.875rem;
          color: #64748b;
        }
        .date-picker-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }
        .stat-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
        .stat-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .stat-icon-container.users { background-color: #eff6ff; color: #3b82f6; }
        .stat-icon-container.donations { background-color: #fff1f2; color: #f43f5e; }
        .stat-icon-container.requests { background-color: #fef2f2; color: #ef4444; }
        .stat-icon-container.camps { background-color: #f0fdf4; color: #22c55e; }
        .stat-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .stat-trend {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .stat-trend.up { color: #16a34a; }
        .stat-trend.down { color: #dc2626; }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          padding: 0 2rem 2rem;
        }
        .chart-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .chart-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .chart-select {
          padding: 0.4rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          font-size: 0.8rem;
          color: #475569;
          outline: none;
          background-color: #f8fafc;
        }
        .line-chart-container {
          height: 180px;
          position: relative;
        }
        .chart-grid-line {
          position: absolute;
          left: 0; right: 0;
          border-top: 1px dashed #e2e8f0;
        }
        .chart-axis-label {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .pie-chart-wrapper {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .pie-legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .legend-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .legend-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .legend-label {
          color: #475569;
          font-weight: 600;
        }
        .legend-value {
          color: #64748b;
        }
        .dashboard-details-grid {
          padding: 0 2rem 2rem;
        }
        .table-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .table-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .view-all-link {
          color: #e11d48;
          font-size: 0.8rem;
          font-weight: 700;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .view-all-link:hover {
          color: #be123c;
        }
        .custom-table-container {
          overflow-x: auto;
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-table th {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
        }
        .premium-table td {
          padding: 1rem;
          font-size: 0.85rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .premium-table tbody tr:hover {
          background-color: #f8fafc;
        }
        .donor-table-id {
          font-family: monospace;
          font-weight: 600;
          color: #64748b;
        }
      `}</style>
      {/* 1. Left Sidebar Navigation */}
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`} data-lenis-prevent="true">
        <div className="brand-container">
          <div className="brand-logo" title="LifeDrop">🩸</div>
          <div>
            <div className="brand-name">Life<span>Drop</span></div>
            <div className="brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Main</div>
          <button
            className={`menu-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
            title="Dashboard"
          >
            <span className="menu-item-icon">📊</span> <span className="menu-item-text">Dashboard</span>
          </button>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Management</div>
          <button
            className={`menu-item ${currentView === "camps" ? "active" : ""}`}
            onClick={() => setCurrentView("camps")}
            title="Camps"
          >
            <span className="menu-item-icon">⛺</span> <span className="menu-item-text">Camps</span>
          </button>
          <button
            className={`menu-item ${currentView === "blood-banks" ? "active" : ""}`}
            onClick={() => setCurrentView("blood-banks")}
            title="Blood Banks"
          >
            <span className="menu-item-icon">🏥</span> <span className="menu-item-text">Blood Banks</span>
          </button>
          <button
            className={`menu-item ${currentView === "users" ? "active" : ""}`}
            onClick={() => setCurrentView("users")}
            title="Donors (Users)"
          >
            <span className="menu-item-icon">👥</span> <span className="menu-item-text">Donors (Users)</span>
          </button>
          <button
            className={`menu-item ${currentView === "enquiries" ? "active" : ""}`}
            onClick={() => setCurrentView("enquiries")}
            title="Enquiries"
          >
            <span className="menu-item-icon">📋</span> <span className="menu-item-text">Enquiries</span>
          </button>
          <button
            className={`menu-item ${currentView === "blood-requests" ? "active" : ""}`}
            onClick={() => setCurrentView("blood-requests")}
            title="Blood Requests"
          >
            <span className="menu-item-icon">🩸</span> <span className="menu-item-text">Blood Requests</span>
          </button>

          <button
            className={`menu-item ${currentView === "blood-bank-requests" ? "active" : ""}`}
            onClick={() => setCurrentView("blood-bank-requests")}
            title="Blood Bank Requests"
          >
            <span className="menu-item-icon">🏥</span> <span className="menu-item-text">Blood Bank Requests</span>
          </button>
          <button
            className={`menu-item ${currentView === "blood-banks" ? "active" : ""}`}
            onClick={() => setCurrentView("blood-banks")}
            title="Blood Banks"
          >
            <span className="menu-item-icon">🏨</span> <span className="menu-item-text">Blood Banks</span>
          </button>
          <button
            className={`menu-item ${currentView === "organizers" ? "active" : ""}`}
            onClick={() => setCurrentView("organizers")}
            title="Organizers"
          >
            <span className="menu-item-icon">🤝</span> <span className="menu-item-text">Organizers</span>
          </button>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Design</div>
          <button
            className={`menu-item ${currentView === "uiux" ? "active" : ""}`}
            onClick={() => setCurrentView("uiux")}
            title="UI/UX"
          >
            <span className="menu-item-icon">🎨</span> <span className="menu-item-text">UI/UX (Personalization)</span>
          </button>
          <button
            className={`menu-item ${currentView === "blood-request-background" ? "active" : ""}`}
            onClick={() => setCurrentView("blood-request-background")}
            title="Blood Request Background"
          >
            <span className="menu-item-icon">🖼️</span> <span className="menu-item-text">Blood Request Background</span>
          </button>
          <button
            className={`menu-item ${currentView === "impact-gallery" ? "active" : ""}`}
            onClick={() => setCurrentView("impact-gallery")}
            title="Impact Gallery"
          >
            <span className="menu-item-icon">🖼️</span> <span className="menu-item-text">Impact Gallery</span>
          </button>
          <button
            className={`menu-item ${currentView === "success-stories" ? "active" : ""}`}
            onClick={() => setCurrentView("success-stories")}
            title="Success Stories"
          >
            <span className="menu-item-icon">🌟</span> <span className="menu-item-text">Success Stories</span>
          </button>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Content Management</div>
          <button
            className={`menu-item ${currentView === "news" ? "active" : ""}`}
            onClick={() => setCurrentView("news")}
            title="News & Awareness"
          >
            <span className="menu-item-icon">📰</span> <span className="menu-item-text">News & Awareness</span>
          </button>
        </div>

        <div className="menu-section">
          <div className="menu-section-title">Settings</div>
          <button className="menu-item" onClick={handleLogout} title="Logout">
            <span className="menu-item-icon">🚪</span> <span className="menu-item-text">Logout</span>
          </button>
        </div>

        <div className="emergency-button-container">
          <button className="emergency-btn">🚨 Emergency Requests</button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-content" data-lenis-prevent="true">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-left">
            <button className="toggle-sidebar-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? '🡨' : '☰'}
            </button>
          </div>

          <div className="header-actions">
            <div className="user-profile-badge">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* --- 1. Dashboard Tab View --- */}
        {currentView === "dashboard" && (
          <>
            <div className="welcome-container">
              <div>
                <h1 className="welcome-title">Welcome back, Admin!</h1>
                <p className="welcome-subtitle">Here's what's happening with LifeDrop today.</p>
              </div>
              <div className="date-picker-badge">
                <span>📅</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="stats-grid">
              <div 
                className="stat-card" 
                onClick={() => setCurrentView("all-users")}
                style={{ cursor: "pointer" }}
              >
                <div className="stat-icon-container users">👥</div>
                <div className="stat-details">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{totalPlatformUsers}</span>
                  <span className="stat-trend up">▲ 12.5%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-container donations">🩸</div>
                <div className="stat-details">
                  <span className="stat-label">Total Donations</span>
                  <span className="stat-value">{totalDonations}</span>
                  <span className="stat-trend up">▲ 8.7%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-container requests">❤️</div>
                <div className="stat-details">
                  <span className="stat-label">Blood Requests</span>
                  <span className="stat-value">{bloodRequests.length}</span>
                  <span className="stat-trend down">▼ 3.2%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-container camps">⛺</div>
                <div className="stat-details">
                  <span className="stat-label">Total Camps</span>
                  <span className="stat-value">{camps.length}</span>
                  <span className="stat-trend up">▲ 6.1%</span>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Donations Overview</h3>
                  <select className="chart-select">
                    <option>This Week</option>
                  </select>
                </div>
                <div className="line-chart-container">
                  <div className="chart-grid-line" style={{ bottom: "25%" }} />
                  <div className="chart-grid-line" style={{ bottom: "50%" }} />
                  <div className="chart-grid-line" style={{ bottom: "75%" }} />

                  <svg viewBox="0 0 500 150" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    <path
                      d="M 10 120 Q 80 50 160 100 T 320 30 T 480 90"
                      fill="none"
                      stroke="#ff2e4b"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="160" cy="100" r="5" fill="#ff2e4b" filter="drop-shadow(0 0 3px #ff2e4b)" />
                    <circle cx="320" cy="30" r="5" fill="#ff2e4b" filter="drop-shadow(0 0 3px #ff2e4b)" />
                  </svg>
                </div>
                <div className="d-flex justify-content-between mt-2 px-2">
                  <span className="chart-axis-label">May 25</span>
                  <span className="chart-axis-label">May 26</span>
                  <span className="chart-axis-label">May 27</span>
                  <span className="chart-axis-label">May 28</span>
                  <span className="chart-axis-label">May 29</span>
                  <span className="chart-axis-label">May 30</span>
                  <span className="chart-axis-label">May 31</span>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Blood Group Distribution</h3>
                </div>
                <div className="pie-chart-wrapper">
                  {renderDonutChart()}
                  <div className="pie-legend">
                    {bloodGroupStats.list.map((bg) => (
                      <div className="legend-item" key={bg.label}>
                        <div className="legend-left">
                          <span className="legend-color" style={{ backgroundColor: bg.color }} />
                          <span className="legend-label">{bg.label}</span>
                        </div>
                        <span className="legend-value">{bg.percentage}% ({bg.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-details-grid">
              <div className="table-card">
                <div className="table-header">
                  <h3 className="table-title">Live Blood Requests (Last 24 Hours)</h3>
                  <button className="view-all-link" onClick={() => setCurrentView("dashboard")}>View All</button>
                </div>

                <div className="custom-table-container">
                  {loadingBloodRequests ? (
                    <p className="text-center py-4 text-muted">Loading...</p>
                  ) : (() => {
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const recentBloodRequests = bloodRequests
                      .filter((req) => new Date(req.createdAt) >= twentyFourHoursAgo)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5);

                    if (recentBloodRequests.length === 0) {
                      return <p className="text-center py-4 text-muted">No blood requests in the last 24 hours.</p>;
                    }

                    return (
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Patient Name</th>
                            <th>Blood Group</th>
                            <th>Hospital / City</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBloodRequests.map((req) => (
                            <tr key={req._id}>
                              <td className="donor-table-id">{req.requestId || `#REQ-${req._id.slice(-4).toUpperCase()}`}</td>
                              <td>{req.patientName}</td>
                              <td>
                                <span className="donor-table-group">{req.bloodGroup}</span>
                                <div className="text-[10px] text-slate-500 font-medium">{req.bloodComponent || "Not specified"}</div>
                              </td>
                              <td>{req.hospital} {req.city ? `(${req.city})` : ''}</td>
                              <td>
                                <span className={`status-badge ${req.status === "fulfilled" ? "fulfilled" : req.status === "closed" ? "urgent" : "pending"}`}>
                                  {req.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>

            </div>
          </>
        )}

        {/* --- 2. Camps Tab View --- */}
        {currentView === "camps" && (
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h2 className="text-danger fw-bold m-0">Camp Registrations</h2>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary" onClick={fetchCamps}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="row g-3 mb-4 align-items-center">
              <div className="col-md-5">
                <div className="btn-group w-100">
                  {["all", "upcoming", "done"].map((t) => (
                    <button
                      key={t}
                      className={`btn ${tab === t ? "btn-danger" : "btn-outline-danger"}`}
                      onClick={() => setTab(t)}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-md-7">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">🔍</span>
                  <input
                    className="form-control border-start-0"
                    placeholder="Search camp by name, hospital, location..."
                    value={campQuery}
                    onChange={(e) => setCampQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loadingCamps ? (
              <p className="text-center py-4">Loading camps database...</p>
            ) : (
              <div className="custom-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Camp Name</th>
                      <th>Date</th>
                      <th>Location / Hospital</th>
                      <th>Organizer</th>
                      <th>Donors</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "all" ? allCampsList : tab === "upcoming" ? upcomingCamps : doneCamps).map((camp) => {
                      const past = !isUpcoming(toDate(camp?.date));
                      const assignedOrg = camp.organizer && typeof camp.organizer === "object" ? camp.organizer : null;

                      return (
                        <tr key={camp._id} style={{ position: 'relative' }}>
                          <td className="fw-bold text-danger">{camp.title || camp.name || camp.campId}</td>
                          <td>
                            <div>{camp.date ? new Date(camp.date).toLocaleDateString() : "No date"}</div>
                            <div className="mt-1">{whenBadge(camp.date)}</div>
                          </td>
                          <td>
                            <div>📍 {camp.location || camp.venue || camp.area || "N/A"}</div>
                            <div className="text-muted small">🏥 {camp.hospitalName || "N/A"}</div>
                            <div className="text-muted small">👤 {camp.proName || "N/A"}</div>
                          </td>
                          <td>
                            {assignedOrg ? (
                              <>
                                <div className="fw-bold text-primary">{assignedOrg.name}</div>
                                <div className="text-muted small">📞 {assignedOrg.mobile || assignedOrg.phone}</div>
                              </>
                            ) : (
                              <>
                                <div className="fw-bold text-dark">{camp.organizerName || "Unassigned"}</div>
                                <div className="text-muted small">📞 {camp.organizerContact || "N/A"}</div>
                              </>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-danger rounded-pill px-3 py-2">
                              {camp.donorCount || 0}
                            </span>
                          </td>
                          <td>
                              <div className="d-flex flex-wrap gap-2">
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => {
                                    setSelectedCamp(camp._id);
                                    setCurrentView("users");
                                  }}
                                >
                                  View Donors
                                </button>
                                <button className="btn btn-sm btn-light border" onClick={() => handleManagePhotosClick(camp)} title="Manage Photos">📸</button>
                                <button className="btn btn-sm btn-light border" onClick={() => handleEditCampClick(camp)} title="Edit Camp">✏️</button>
                                <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDeleteCamp(camp._id)} title="Delete Camp">🗑️</button>
                                <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  if (past) return;
                                  const link = `${window.location.origin}/register-camp?campId=${camp._id}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Registration link copied to clipboard!");
                                }}
                                disabled={past}
                                title="Copy Registration Link"
                              >
                                🔗
                              </button>
                            </div>

                            {editCampId === camp._id && (
                              <div className="mt-3 border rounded p-3 bg-light shadow-sm position-absolute" style={{ zIndex: 10, minWidth: '300px', right: '50px' }}>
                                <h6 className="text-primary fw-bold mb-3">Edit Camp Details</h6>
                                <div className="row g-2">
                                  {[
                                    ["name", "Camp Name"],
                                    ["location", "Location"],
                                    ["date", "Date"],
                                    ["organizerName", "Org. Name (Manual)"],
                                    ["organizerContact", "Org. Contact (Manual)"],
                                    ["proName", "PRO Name"],
                                    ["hospitalName", "Hospital Name"],
                                  ].map(([key, label]) => (
                                    <div className="col-12" key={key}>
                                      <label className="form-label small mb-0 fw-bold text-muted">{label}</label>
                                      <input
                                        className="form-control form-control-sm"
                                        name={key}
                                        type={key === "date" ? "date" : "text"}
                                        value={editCampForm[key] || ""}
                                        onChange={handleEditCampChange}
                                      />
                                    </div>
                                  ))}
                                  <div className="col-12">
                                    <label className="form-label small mb-0 fw-bold text-muted">Status</label>
                                    <select
                                      className="form-select form-select-sm"
                                      name="status"
                                      value={editCampForm.status || "upcoming"}
                                      onChange={handleEditCampChange}
                                    >
                                      <option value="upcoming">Upcoming</option>
                                      <option value="ongoing">Ongoing</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button className="btn btn-sm btn-success flex-grow-1" onClick={() => handleEditCampSave(camp._id)}>Save Changes</button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setEditCampId(null)}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* --- Camp Photos Modal --- */}
            {photosCampId && photosCampObj && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                    <div className="modal-header border-0 pb-0">
                      <h5 className="modal-title fw-bold">Manage Camp Photos</h5>
                      <button type="button" className="btn-close" onClick={() => setPhotosCampId(null)}></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-muted small mb-4">Camp: <strong>{photosCampObj.name || photosCampObj.title}</strong></p>
                      
                      {/* Existing Photos Grid */}
                      <h6 className="fw-bold mb-3">Uploaded Photos ({photosCampObj.photos?.length || 0})</h6>
                      {photosCampObj.photos && photosCampObj.photos.length > 0 ? (
                        <div className="d-flex flex-wrap gap-3 mb-4">
                          {photosCampObj.photos.map((url, idx) => (
                            <img key={idx} src={url} alt="Camp" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small mb-4">No photos uploaded yet.</p>
                      )}

                      {/* Upload Form */}
                      <div className="p-4 bg-light rounded-3 border">
                        <h6 className="fw-bold mb-3">Upload New Photos</h6>
                        <form onSubmit={handleCampPhotosUpload}>
                          <input 
                            type="file" 
                            className="form-control mb-3" 
                            multiple 
                            accept="image/*"
                            onChange={(e) => setCampPhotosFiles(e.target.files)}
                            disabled={uploadingPhotos}
                          />
                          <div className="text-end">
                            <button type="submit" className="btn btn-primary px-4" disabled={uploadingPhotos || !campPhotosFiles}>
                              {uploadingPhotos ? "Uploading..." : "Upload Photos"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- All Platform Users Tab View --- */}
        {currentView === "all-users" && (
          <div className="chart-card mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="text-primary fw-bold m-0">All Platform Users</h2>
              <button className="btn btn-outline-secondary" onClick={fetchAllUsers}>
                Refresh List
              </button>
            </div>

            <div className="custom-table-container">
              {loadingAllUsers ? (
                <p className="text-center py-4">Loading users...</p>
              ) : allUsers.length === 0 ? (
                <p className="text-center py-4 text-muted">No users found.</p>
              ) : (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Blood Group</th>
                      <th>City</th>
                      <th>Mobile</th>
                      <th>Total Donations</th>
                      <th>Eligibility</th>
                      <th>Next Eligible Date</th>
                      <th>Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user, idx) => (
                      <tr key={user._id}>
                        <td className="donor-table-id">#{idx + 1}</td>
                        <td className="fw-bold">{user.name}</td>
                        <td>
                          <span className={`status-badge ${user.role === "donor" ? "fulfilled" : user.role === "organizer" ? "active" : "pending"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td><span className="donor-table-group">{user.bloodGroup || "-"}</span></td>
                        <td>{user.city || "-"}</td>
                        <td>{user.mobile || user.phone || "-"}</td>
                        <td>{user.totalDonations || 0}</td>
                        <td>
                          {user.role === "donor" ? (
                            <span className={`badge ${
                              user.donationEligibilityStatus === "Eligible to Donate" 
                                ? "bg-success" 
                                : "bg-warning text-dark"
                            }`}>
                              {user.donationEligibilityStatus || "Eligible"}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {user.role === "donor" && user.nextEligibleDonationDate
                            ? new Date(user.nextEligibleDonationDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td>
                          {user.role === "donor" 
                            ? (user.daysRemaining > 0 ? `${user.daysRemaining} days` : "0 days")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- 3. Donors Tab View --- */}
        {currentView === "users" && (
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-danger fw-bold m-0">Donors Database</h2>
                {camps.length > 0 && (
                  <select
                    className="form-select mt-2 w-auto"
                    value={selectedCamp || ""}
                    onChange={(e) => setSelectedCamp(e.target.value)}
                  >
                    <option value="all">-- All Donors (All Camps) --</option>
                    {camps.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-danger" onClick={downloadPDF} disabled={donors.length === 0}>
                  📥 Export PDF Report
                </button>
                <button className="btn btn-outline-secondary" onClick={fetchDonors}>
                  Refresh Table
                </button>
              </div>
            </div>

            <div className="custom-table-container">
              {loadingDonors ? (
                <p className="text-center py-4">Loading donors list...</p>
              ) : donors.length === 0 ? (
                <p className="text-center py-4 text-muted">No donors registered yet for this camp.</p>
              ) : (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Group</th>
                      <th>Age</th>
                      <th>Weight</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((d, index) => (
                      <tr key={d._id}>
                        <td>{index + 1}</td>
                        <td>
                          {editDonorId === d._id ? (
                            <input
                              className="form-control form-control-sm"
                              name="name"
                              value={editForm.name || ""}
                              onChange={handleEditChange}
                            />
                          ) : (
                            <span className="fw-semibold">{d.name}</span>
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <select
                              className="form-select form-select-sm"
                              name="bloodGroup"
                              value={editForm.bloodGroup || ""}
                              onChange={handleEditChange}
                            >
                              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bg) => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="donor-table-group">{d.bloodGroup}</span>
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <input
                              className="form-control form-control-sm"
                              name="age"
                              type="number"
                              value={editForm.age || ""}
                              onChange={handleEditChange}
                            />
                          ) : (
                            d.age
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <input
                              className="form-control form-control-sm"
                              name="weight"
                              type="number"
                              value={editForm.weight || ""}
                              onChange={handleEditChange}
                            />
                          ) : (
                            `${d.weight || ""} kg`
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <input
                              className="form-control form-control-sm"
                              name="phone"
                              value={editForm.phone || ""}
                              onChange={handleEditChange}
                            />
                          ) : (
                            d.phone
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <input
                              className="form-control form-control-sm"
                              name="address"
                              value={editForm.address || ""}
                              onChange={handleEditChange}
                            />
                          ) : (
                            d.address
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <select
                              className="form-select form-select-sm"
                              name="remark"
                              value={editForm.remark || "Pending"}
                              onChange={handleEditChange}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Donated">Donated</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className={`status-badge ${d.remark === "Donated" ? "fulfilled" : d.remark === "Rejected" ? "urgent" : "pending"}`}>
                              {d.remark || "Pending"}
                            </span>
                          )}
                        </td>
                        <td>
                          {editDonorId === d._id ? (
                            <div className="btn-group">
                              <button className="btn btn-sm btn-success" onClick={() => handleEditSave(d._id)}>✓</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setEditDonorId(null)}>✕</button>
                            </div>
                          ) : (
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(d)}>✎</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDonor(d._id)}>🗑️</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- 4. Enquiries Tab View --- */}
        {currentView === "enquiries" && (
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h2 className="text-danger fw-bold m-0">📋 Organizer Enquiries</h2>
              <button className="btn btn-primary" onClick={fetchEnquiries}>
                Refresh Enquiries
              </button>
            </div>

            {/* Enquiries Filtering controls */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="btn-group w-100">
                  {["pending", "approved", "rejected", "all"].map((t) => (
                    <button
                      key={t}
                      className={`btn ${enquiriesTab === t ? "btn-danger" : "btn-outline-danger"}`}
                      onClick={() => setEnquiriesTab(t)}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Search enquiry..."
                  value={enquiryQuery}
                  onChange={(e) => setEnquiryQuery(e.target.value)}
                />
              </div>
            </div>

            {loadingEnquiries ? (
              <p className="text-center py-4">Loading enquiries...</p>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-4 text-muted border border-dashed rounded p-4 bg-light">
                No enquiries found.
              </div>
            ) : (
              <div className="row g-4">
                {filteredEnquiries.map((e) => (
                  <div className="col-lg-6" key={e._id}>
                    <div className={`card h-100 shadow-sm border-2 border-${e.status === "pending" ? "warning" : e.status === "approved" ? "success" : "secondary"}`}>
                      <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 text-danger fw-bold">{e.organizationName || e.organizationType || "Camp Enquiry"}</h5>
                        <span className={`badge ${e.status === "pending" ? "bg-warning text-dark" : e.status === "approved" ? "bg-success" : "bg-secondary"}`}>
                          {e.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="card-body">
                        <div className="row">
                          <div className="col-sm-6 mb-3">
                            <h6 className="text-muted text-uppercase small fw-bold">Organizer Details</h6>
                            <div className="fw-semibold">{e.organizerName}</div>
                            <div className="small text-muted">📧 {e.email}</div>
                            <div className="small text-muted">📞 {e.phone}</div>
                          </div>
                          <div className="col-sm-6 mb-3">
                            <h6 className="text-muted text-uppercase small fw-bold">Camp Details</h6>
                            <div className="small">📅 {e.preferredDate ? new Date(e.preferredDate).toLocaleDateString() : "TBA"} {e.preferredTime ? `(${e.preferredTime})` : ""}</div>
                            <div className="small">📍 {e.area || "N/A"}</div>
                            <div className="small">👥 Expected Donors: {e.expectedDonors || "N/A"}</div>
                          </div>
                        </div>

                        {e.message && (
                          <div className="alert alert-light border small p-2 mb-2 text-dark">
                            <strong>Msg:</strong> {e.message}
                          </div>
                        )}
                        {e.status === "rejected" && (
                          <div className="alert alert-danger small p-2">
                            <strong>Reason:</strong> {e.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="card-footer bg-transparent">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">
                            Submitted: {new Date(e.createdAt).toLocaleDateString()}
                          </small>

                          <div className="btn-group">
                            {e.status === "approved" && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => {
                                  setResetEnquiryModal(e);
                                  setNewEnquiryPassword("");
                                }}
                              >
                                🔑 Set Password
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEditEnquiryModal(e)}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEnquiry(e._id)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>

                        {e.status === "pending" && (
                          <div className="mt-2 pt-2 border-top">
                            <div className="input-group input-group-sm mb-2">
                              <span className="input-group-text bg-transparent text-muted">Password</span>
                              <input
                                className="form-control"
                                placeholder="Auto or Manual Password"
                                value={passwordById[e._id] || ""}
                                onChange={(ev) => setPasswordById({ ...passwordById, [e._id]: ev.target.value })}
                              />
                              <button className="btn btn-success" onClick={() => approveEnquiry(e._id)}>
                                Approve
                              </button>
                            </div>
                            <div className="input-group input-group-sm">
                              <input
                                className="form-control"
                                placeholder="Rejection reason..."
                                value={rejectReasonById[e._id] || ""}
                                onChange={(ev) => setRejectReasonById({ ...rejectReasonById, [e._id]: ev.target.value })}
                              />
                              <button className="btn btn-secondary" onClick={() => rejectEnquiry(e._id)}>
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            VIEW: BLOOD REQUESTS
            ============================================================ */}
        {currentView === "blood-requests" && (
          <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-3xl font-black text-slate-800 font-cinzel mb-1">Emergency Blood Requests</h2>
                <p className="text-slate-500 font-medium">Manage, filter, and notify donors for blood requests</p>
              </div>
              <button
                onClick={() => fetchBloodRequests({ state: brFilterState, bloodGroup: brFilterBloodGroup, status: brFilterStatus })}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Patient / City</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={brSearchQuery}
                  onChange={(e) => setBrSearchQuery(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 bg-slate-50 min-w-[180px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">State</label>
                <select
                  value={brFilterState}
                  onChange={(e) => { setBrFilterState(e.target.value); fetchBloodRequests({ state: e.target.value, bloodGroup: brFilterBloodGroup, status: brFilterStatus }); }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 bg-slate-50 cursor-pointer"
                >
                  <option value="">All States</option>
                  {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar Islands","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blood Group</label>
                <select
                  value={brFilterBloodGroup}
                  onChange={(e) => { setBrFilterBloodGroup(e.target.value); fetchBloodRequests({ state: brFilterState, bloodGroup: e.target.value, status: brFilterStatus }); }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 bg-slate-50 cursor-pointer"
                >
                  <option value="">All Groups</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={brFilterStatus}
                  onChange={(e) => { setBrFilterStatus(e.target.value); fetchBloodRequests({ state: brFilterState, bloodGroup: brFilterBloodGroup, status: e.target.value }); }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 bg-slate-50 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {(brFilterState || brFilterBloodGroup || brFilterStatus || brSearchQuery) && (
                <button
                  onClick={() => { setBrFilterState(""); setBrFilterBloodGroup(""); setBrFilterStatus(""); setBrSearchQuery(""); fetchBloodRequests(); }}
                  className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  ✕ Clear Filters
                </button>
              )}
              <div className="ml-auto text-sm font-semibold text-slate-500">
                {bloodRequests.filter(r => {
                  if (!brSearchQuery) return true;
                  const q = brSearchQuery.toLowerCase();
                  return (r.patientName||r.name||"").toLowerCase().includes(q) || (r.city||"").toLowerCase().includes(q) || (r.hospitalName||r.hospital||"").toLowerCase().includes(q);
                }).length} results
              </div>
            </div>

            {loadingBloodRequests ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bloodRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="text-6xl mb-4">🙌</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Requests Found</h3>
                <p className="text-slate-500">Try clearing your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bloodRequests
                  .filter(r => {
                    if (!brSearchQuery) return true;
                    const q = brSearchQuery.toLowerCase();
                    return (r.patientName||r.name||"").toLowerCase().includes(q) || (r.city||"").toLowerCase().includes(q) || (r.hospitalName||r.hospital||"").toLowerCase().includes(q);
                  })
                  .map((req) => (
                  <div key={req._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Top badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                          ID: {req.requestId || req._id?.slice(-6)}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          req.urgency === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {req.urgency === 'urgent' ? '🚨 Urgent' : '📅 Planned'}
                        </span>
                        <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                          🩸 {req.bloodGroup} × {req.unitsNeeded || req.units || 1} ({req.bloodComponent || "Not specified"})
                        </span>
                        {req.state && (
                          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-200">
                            📌 {req.state}
                          </span>
                        )}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          req.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          req.status === 'accepted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {req.status === 'active' ? '📡 Active' : req.status === 'pending' ? '⏳ Pending' : req.status === 'accepted' ? '🤝 Accepted' : '✅ Completed'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-auto">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Patient & Hospital */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{req.patientName || req.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">🏥 {req.hospitalName || req.hospital}, {req.hospitalArea || req.area || ""} — 📍 {req.city}{req.state ? `, ${req.state}` : ""}</p>
                        {req.mobile && <p className="text-sm text-slate-600 mt-0.5">📞 Requester: <span className="font-semibold">{req.mobile}</span></p>}
                      </div>

                      {req.additionalInfo && (
                        <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 italic">
                          &ldquo;{req.additionalInfo}&rdquo;
                        </div>
                      )}

                      {req.acceptedBy && (
                        <div className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-semibold text-green-800 mb-1">✅ Donor Details (Accepted)</div>
                          <div className="text-green-700">Name: {req.acceptedBy.name}</div>
                          <div className="text-green-700">Contact: {req.acceptedBy.mobile}</div>
                          {(req.acceptedBy.city || req.acceptedBy.state) && (
                            <div className="text-green-700">
                              Location: {req.acceptedBy.city || ""}{req.acceptedBy.city && req.acceptedBy.state ? ", " : ""}{req.acceptedBy.state || ""}
                            </div>
                          )}
                          {req.acceptedAt && <div className="text-green-700">Accepted On: {new Date(req.acceptedAt).toLocaleString()}</div>}
                          {req.otp && <div className="text-green-700 mt-1 font-mono">OTP: <strong>{req.otp}</strong></div>}
                        </div>
                      )}
                    </div>

                    {/* Right Control Panel */}
                    <div className="w-full md:w-52 flex flex-col gap-3 shrink-0">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Control</div>
                        <select
                          value={req.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (window.confirm(`Change status to "${newStatus}"?`)) {
                              try {
                                await adminService.updateBloodRequestStatus(req.requestId || req._id, newStatus);
                                fetchBloodRequests({ state: brFilterState, bloodGroup: brFilterBloodGroup, status: brFilterStatus });
                                toast.success("Status updated!");
                              } catch (err) {
                                toast.error("Error updating status");
                              }
                            }
                          }}
                          className={`w-full p-2.5 rounded-lg border-2 font-bold text-xs outline-none cursor-pointer appearance-none ${
                            req.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                            req.status === 'active' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                            req.status === 'accepted' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                            'border-green-200 bg-green-50 text-green-700'
                          }`}
                        >
                          <option value="pending">⏳ Pending Review</option>
                          <option value="active">📡 Active</option>
                          <option value="accepted">🤝 Accepted</option>
                          <option value="completed">✅ Completed</option>
                        </select>
                      </div>

                      {/* Notify Button */}
                      <button
                        onClick={() => handleNotifyDonors(req.requestId || req._id)}
                        disabled={notifyingId === (req.requestId || req._id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold shadow hover:from-red-500 hover:to-rose-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {notifyingId === (req.requestId || req._id) ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : "📣"}
                        {notifyingId === (req.requestId || req._id) ? "Notifying..." : "Notify Donors"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 5. Organizers Tab View --- */}
        {currentView === "organizers" && (
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h2 className="text-danger fw-bold m-0">Organizers Directory</h2>
              <button className="btn btn-outline-secondary" onClick={fetchOrganizersList}>
                Refresh Organizers
              </button>
            </div>

            {loadingOrganizers ? (
              <p className="text-center py-4">Loading organizers database...</p>
            ) : (
              <div className="custom-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Contact / Email</th>
                      <th>Status</th>
                      <th>Assigned Camps Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizersList.length > 0 ? (
                      organizersList.map((org, index) => (
                        <tr key={org._id}>
                          <td>{index + 1}</td>
                          <td>
                            {editOrganizerId === org._id ? (
                              <input
                                className="form-control form-control-sm"
                                name="name"
                                value={editOrganizerForm.name}
                                onChange={handleOrganizerFormChange}
                              />
                            ) : (
                              <span className="fw-bold">{org.name}</span>
                            )}
                          </td>
                          <td>
                            <div className="small text-muted">📧 {org.email}</div>
                            {editOrganizerId === org._id ? (
                              <input
                                className="form-control form-control-sm mt-1"
                                name="phone"
                                value={editOrganizerForm.phone}
                                onChange={handleOrganizerFormChange}
                              />
                            ) : (
                              <div className="small">📞 {org.phone}</div>
                            )}
                          </td>
                          <td>
                            {editOrganizerId === org._id ? (
                              <select
                                className="form-select form-select-sm"
                                name="isActive"
                                value={editOrganizerForm.isActive}
                                onChange={(e) =>
                                  setEditOrganizerForm({
                                    ...editOrganizerForm,
                                    isActive: e.target.value === "true",
                                  })
                                }
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            ) : org.isActive ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-secondary">Inactive</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="badge bg-primary">Total Camps: {org.camps?.length || 0}</span>
                            </div>
                            {org.camps && org.camps.length > 0 ? (
                              <ul className="list-unstyled mb-0 small">
                                {org.camps.map((camp) => (
                                  <li key={camp._id} className="mb-2 pb-2 border-bottom">
                                    <div className="fw-bold text-dark mb-1">
                                      🏕️ {camp.title || camp.name || camp.campId}
                                    </div>
                                    <div className="d-flex align-items-center text-muted flex-wrap gap-2">
                                      <span>📅 {camp.date ? new Date(camp.date).toLocaleDateString() : "No date"}</span>
                                      <span>📍 {camp.location || camp.venue || "No location"}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted fst-italic small">No camps assigned yet.</span>
                            )}
                          </td>
                          <td>
                            {editOrganizerId === org._id ? (
                              <div className="btn-group">
                                <button className="btn btn-sm btn-success" onClick={() => handleSaveOrganizer(org._id)}>Save</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditOrganizerId(null)}>Cancel</button>
                              </div>
                            ) : (
                              <div className="btn-group">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditOrganizerClick(org)}>Edit</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteOrganizer(org._id)}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">No organizers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- 7. Impact Gallery Tab View --- */}
        {currentView === "impact-gallery" && (
          <div className="dashboard-details-grid pt-4">
            <ImpactGalleryAdmin />
          </div>
        )}

        {/* --- 8. Success Stories Tab View --- */}
        {currentView === "success-stories" && (
          <div className="dashboard-details-grid pt-4">
            <SuccessStoriesAdmin />
          </div>
        )}

        {/* --- Blood Banks Tab View --- */}
        {currentView === "blood-banks" && (
          <div className="dashboard-details-grid pt-4">
            <AdminBloodBanks />
          </div>
        )}

        {/* --- 9. News & Awareness Tab View --- */}
        {currentView === "news" && (
          <div className="dashboard-details-grid pt-4">
            <NewsAdmin />
          </div>
        )}

        {/* --- UI/UX / Personalized Homepage Content Manager --- */}
        {currentView === "uiux" && (
          <div className="dashboard-details-grid pt-4">
            <HomeContentAdmin />
          </div>
        )}

        {/* --- 9. Blood Request Background Tab View --- */}
        {currentView === "blood-request-background" && (
          <div className="dashboard-details-grid pt-4">
            <BloodRequestBackgroundAdmin />
          </div>
        )}

        <footer className="copyright-footer">
          © 2026 LifeDrop Admin Dashboard. All rights reserved.
        </footer>
        {/* --- 9. Blood Bank Requests --- */}
        {currentView === "blood-bank-requests" && (
          <div className="fade-in">
            <AdminBloodBankRequests />
          </div>
        )}

        {/* --- 10. Blood Banks --- */}
        {currentView === "blood-banks" && (
          <div className="fade-in">
            <AdminBloodBanks />
          </div>
        )}
      </main>

      {/* --- ADD CAMP MODAL --- */}
      {showAddCampModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content">
            <button className="modal-close-btn" onClick={() => setShowAddCampModal(false)}>×</button>
            <h4 className="text-danger fw-bold mb-4">Add New Donation Camp</h4>

            <form onSubmit={handleNewCampSubmit} className="dark-form d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label>Camp Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="name"
                    value={newCamp.name}
                    onChange={handleNewCampChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label>Hospital Partner</label>
                  <input
                    className="form-control"
                    type="text"
                    name="hospitalName"
                    value={newCamp.hospitalName}
                    onChange={handleNewCampChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label>Location</label>
                  <input
                    className="form-control"
                    type="text"
                    name="location"
                    value={newCamp.location}
                    onChange={handleNewCampChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label>Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="date"
                    value={newCamp.date}
                    onChange={handleNewCampChange}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <label>Assign Active Organizer</label>
                  <select
                    className="form-select"
                    name="organizerId"
                    value={newCamp.organizerId}
                    onChange={handleOrganizerSelect}
                    required
                  >
                    <option value="">-- Select Organizer --</option>
                    {organizersList.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name} ({org.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label>Organizer Contact</label>
                  <input
                    className="form-control"
                    type="text"
                    value={newCamp.organizerContact}
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label>PRO Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="proName"
                    value={newCamp.proName}
                    onChange={handleNewCampChange}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                Create & Publish Camp
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ENQUIRY EDIT MODAL --- */}
      {editingEnquiry && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content">
            <button className="modal-close-btn" onClick={() => setEditingEnquiry(null)}>×</button>
            <h4 className="text-danger fw-bold mb-4">Edit Enquiry Details</h4>

            <form onSubmit={(e) => { e.preventDefault(); saveEditEnquiry(); }} className="dark-form d-flex flex-column gap-3">
              <div className="row g-2">
                <div className="col-md-6">
                  <label>Organizer Name</label>
                  <input className="form-control" name="organizerName" value={editEnquiryForm.organizerName} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-md-6">
                  <label>Phone</label>
                  <input className="form-control" name="phone" value={editEnquiryForm.phone} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-12">
                  <label>Email</label>
                  <input className="form-control" name="email" value={editEnquiryForm.email} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-12"><hr className="border-secondary" /></div>
                <div className="col-12">
                  <label>Camp Name</label>
                  <input className="form-control" name="campName" value={editEnquiryForm.campName} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-md-6">
                  <label>Date</label>
                  <input type="date" className="form-control" name="campDate" value={editEnquiryForm.campDate} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-md-6">
                  <label>Hospital</label>
                  <input className="form-control" name="hospitalName" value={editEnquiryForm.hospitalName} onChange={handleEditEnquiryChange} />
                </div>
                <div className="col-12">
                  <label>Location</label>
                  <textarea className="form-control" name="campLocation" rows="2" value={editEnquiryForm.campLocation} onChange={handleEditEnquiryChange}></textarea>
                </div>
                <div className="col-12">
                  <label>Message</label>
                  <textarea className="form-control" name="message" rows="2" value={editEnquiryForm.message} onChange={handleEditEnquiryChange}></textarea>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET ENQUIRY PASSWORD MODAL --- */}
      {resetEnquiryModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content" style={{ maxWidth: "400px" }}>
            <button className="modal-close-btn" onClick={() => setResetEnquiryModal(null)}>×</button>
            <h4 className="text-danger fw-bold mb-3">🔑 Set New Password</h4>
            <p className="small text-muted mb-3">Organizer: <strong>{resetEnquiryModal.organizerName}</strong></p>

            <div className="dark-form d-flex flex-column gap-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter new password"
                value={newEnquiryPassword}
                onChange={(e) => setNewEnquiryPassword(e.target.value)}
              />
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary" onClick={() => setResetEnquiryModal(null)}>Cancel</button>
                <button className="btn btn-warning text-dark fw-bold" onClick={resetEnquiryPassword}>Update Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
