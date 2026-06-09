import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaBars } from "react-icons/fa";
import { FaLocationCrosshairs } from "react-icons/fa6";
import {
  customersAPI,
  siteVisitAPI,
  mnreAPI,
  loanAPI,
  paymentAPI,
  ksebAPI,
  ksebRegistrationAPI,
  dcrAPI,
  materialDeliveryAPI,
  installationAPI,
  serviceAPI,
} from "../../api";
import useConfirm from "../../hooks/useConfirm";

const getGoogleMapsUrl = (location) => {
  if (!location) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

const renderMediaUrl = (path) => {
  if (!path) return "https://cdn.corenexis.com/files/c/5589175720.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${process.env.REACT_APP_BASE_URL}${path}`;
};

const getPdfPreviewUrl = (path) => {
  if (!path) return "#";
  const fullUrl = path.startsWith("http") ? path : `${process.env.REACT_APP_BASE_URL}${path}`;
  

  if (fullUrl.toLowerCase().endsWith('.pdf') || fullUrl.includes('/raw/upload/')) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  }
  return fullUrl;
};

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { ConfirmDialog, confirm } = useConfirm();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const customerTabs = [
    { key: "profile", label: "Profile" },
    { key: "site", label: "Site Visit" },
    { key: "mnre", label: "MNRE Profile" },
    { key: "payment", label: "Payment Flow" },
    { key: "loan", label: "Bank Loan" },
    { key: "kseb", label: "KSEB" },
    { key: "material_delivery", label: "Material Delivery" },
    { key: "installation", label: "Installation" },
    { key: "kseb_registration", label: "KSEB Registration & Commissioning" },
    { key: "dcr", label: "DCR" },
    { key: "mnre_installation", label: "MNRE Installation Details" },
    { key: "service", label: "Service" },
  ];

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get("tab");
    const validTabKeys = [
      "profile", "site", "mnre", "payment", "loan", "kseb",
      "material_delivery", "installation", "kseb_registration", "dcr",
      "mnre_installation", "service"
    ];

    if (tabParam && validTabKeys.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab("profile");
    }
  }, [location.search]);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setMenuOpen(false);
  };
  
  const [profileImage, setProfileImage] = useState(null);

  // Site Visit State
  const [siteVisit, setSiteVisit] = useState(null);
  const [siteEdit, setSiteEdit] = useState(false);
  const [siteImages, setSiteImages] = useState([]); // പുതിയ ഇമേജ് അപ്പൻഡ് ചെയ്യാൻ ലിസ്റ്റ്
  const [existingImages, setExistingImages] = useState([]);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // MNRE State
  const [mnreProfile, setMnreProfile] = useState(null);
  const [mnreEdit, setMnreEdit] = useState(false);
  const [mnreDraft, setMnreDraft] = useState(null);

  // MNRE Installation Details State
  const [mnreInstallation, setMnreInstallation] = useState(null);
  const [mnreInstallationEdit, setMnreInstallationEdit] = useState(false);
  const [mnreInstallationDraft, setMnreInstallationDraft] = useState(null);
  const [mnreInstallationSaveLoading, setMnreInstallationSaveLoading] = useState(false);

  // Payment State
  const [payment, setPayment] = useState(null);
  const [paymentEdit, setPaymentEdit] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [paymentImages, setPaymentImages] = useState([]);
  const [existingPaymentImages, setExistingPaymentImages] = useState([]);

  // Bank Loan State
  const [loanProfile, setLoanProfile] = useState(null);
  const [loanEdit, setLoanEdit] = useState(false);
  const [loanDraft, setLoanDraft] = useState(null);

  // KSEB General State
  const [ksebProfile, setKsebProfile] = useState(null);
  const [ksebEdit, setKsebEdit] = useState(false);
  const [ksebDraft, setKsebDraft] = useState(null);

  // KSEB Registration & Commissioning State
  const [ksebRegistration, setKsebRegistration] = useState(null);
  const [ksebRegistrationEdit, setKsebRegistrationEdit] = useState(false);
  const [ksebRegistrationDraft, setKsebRegistrationDraft] = useState(null);
  const [ksebRegistrationLoading, setKsebRegistrationLoading] = useState(false);

  // DCR State
  const [dcr, setDcr] = useState(null);
  const [dcrEdit, setDcrEdit] = useState(false);
  const [dcrDraft, setDcrDraft] = useState(null);
  const [dcrLoading, setDcrLoading] = useState(false);

  // Material Delivery State
  const [materialDelivery, setMaterialDelivery] = useState(null);
  const [materialDeliveryEdit, setMaterialDeliveryEdit] = useState(false);
  const [materialDeliveryDraft, setMaterialDeliveryDraft] = useState({
    changes: "", extra_material: "", structure_changes: "",
    electrical_delivered: false, structure_delivered: false,
    panel_delivered: false, comments: ""
  });
  const [materialDeliveryLoading, setMaterialDeliveryLoading] = useState(false);

  // Service State
  const [services, setServices] = useState([]);
  const [serviceEditIndex, setServiceEditIndex] = useState(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    date: "", images: [], existingImages: [], comments: ""
  });
  const [serviceSaveLoading, setServiceSaveLoading] = useState(false);

  // Loading States for Save Operations
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [siteSaveLoading, setSiteSaveLoading] = useState(false);
  const [mnreSaveLoading, setMnreSaveLoading] = useState(false);
  const [paymentSaveLoading, setPaymentSaveLoading] = useState(false);
  const [loanSaveLoading, setLoanSaveLoading] = useState(false);
  const [ksebSaveLoading, setKsebSaveLoading] = useState(false);

  // Installation State
  const [installation, setInstallation] = useState(null);
  const [installationEdit, setInstallationEdit] = useState(false);
  const [installationDraft, setInstallationDraft] = useState({
    electrical_installed: false, electrical_comments: "",
    structure_installed: false, structure_comments: "", geo_images: []
  });
  const [installationLoading, setInstallationLoading] = useState(false);
  const [existingGeoImages, setExistingGeoImages] = useState([]);

  const stateDistrictMap = {
    Kerala: [
      "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
      "Kottayam", "Idukki", "Ernakulam", "Thrissur",
      "Palakkad", "Malappuram", "Kozhikode", "Wayanad",
      "Kannur", "Kasaragod"
    ]
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ==========================================
  // SIDE EFFECTS
  // ==========================================
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await customersAPI.get(id);
        setCustomer(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchSiteVisit = async () => {
      try {
        const res = await siteVisitAPI.get(id);
        setSiteVisit(res.data);
      } catch (err) {
        setSiteVisit(null);
      }
    };
    fetchSiteVisit();
  }, [id]);

  useEffect(() => {
    const fetchMnre = async () => {
      try {
        const res = await mnreAPI.get(id);
        setMnreProfile(res.data);
      } catch (err) {
        setMnreProfile(null);
      }
    };

    const fetchLoan = async () => {
      try {
        const res = await loanAPI.get(id);
        setLoanProfile(res.data);
        setLoanDraft(res.data);
      } catch (err) {
        setLoanProfile(null);
        setLoanDraft(null);
      }
    };

    fetchMnre();
    fetchLoan();
  }, [id]);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await paymentAPI.get(id);
        setPayment(res.data);
        setExistingPaymentImages(res.data.images || []);
      } catch (err) {
        setPayment(null);
      }
    };
    fetchPayment();
  }, [id]);

  useEffect(() => {
    const fetchKseb = async () => {
      try {
        const res = await ksebAPI.get(id);
        setKsebProfile(res.data);
        setKsebDraft(res.data);
      } catch (err) {
        setKsebProfile(null);
      }
    };
    fetchKseb();
  }, [id]);

  useEffect(() => {
    const fetchKsebRegistration = async () => {
      try {
        const res = await ksebRegistrationAPI.get(id);
        setKsebRegistration(res.data);
        setKsebRegistrationDraft(res.data);
      } catch (err) {
        setKsebRegistration(null);
      }
    };
    fetchKsebRegistration();
  }, [id]);

  useEffect(() => {
    const fetchDcr = async () => {
      try {
        const res = await dcrAPI.get(id);
        setDcr(res.data);
        setDcrDraft(res.data);
      } catch (err) {
        setDcr(null);
      }
    };
    fetchDcr();
  }, [id]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await serviceAPI.getServices(id);
        setServices(data);
      } catch (err) {
        setServices([]);
      }
    };
    if (activeTab === "service") fetchServices();
  }, [id, activeTab]);

  useEffect(() => {
    const fetchMnreInstallation = async () => {
      try {
        const res = await mnreAPI.getInstallation(id);
        if (res.status === 404) {
          setMnreInstallation(null);
          setMnreInstallationDraft({
            installation_status: "", installation_comments: "",
            approval_status: "", approval_comments: "",
            subsidy_status: "", subsidy_comments: "",
          });
          return;
        }
        setMnreInstallation(res.data);
        setMnreInstallationDraft(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (id && activeTab === "mnre_installation") fetchMnreInstallation();
  }, [id, activeTab]);

  useEffect(() => {
    if (siteVisit?.images) setExistingImages(siteVisit.images);
  }, [siteVisit]);

  useEffect(() => {
    return () => { if (profileImage) URL.revokeObjectURL(profileImage); };
  }, [profileImage]);

  useEffect(() => {
    const first = parseFloat(loanDraft?.first_payment || 0);
    const second = parseFloat(loanDraft?.second_payment || 0);
    setLoanDraft((prev) => ({ ...prev, total_loan: first + second }));
  }, [loanDraft?.first_payment, loanDraft?.second_payment]);

  useEffect(() => {
    const fetchInstallation = async () => {
      try {
        setInstallationLoading(true);
        const res = await installationAPI.get(id);

        if (res.status === 404) {
          setInstallation(null);
          setInstallationDraft({
            electrical_installed: false, electrical_comments: "",
            structure_installed: false, structure_comments: "", geo_images: [],
          });
          setExistingGeoImages([]);
          return;
        }

        const data = res.data;
        setInstallation(data);
        setInstallationDraft({
          electrical_installed: data.electrical_installed || false,
          electrical_comments: data.electrical_comments || "",
          structure_installed: data.structure_installed || false,
          structure_comments: data.structure_comments || "",
          geo_images: [],
        });
        setExistingGeoImages(data.geo_images || []);
      } catch (err) {
        setInstallation(null);
        setInstallationDraft({
          electrical_installed: false, electrical_comments: "",
          structure_installed: false, structure_comments: "", geo_images: [],
        });
        setExistingGeoImages([]);
      } finally {
        setInstallationLoading(false);
      }
    };

    if (id && activeTab === "installation") {
      fetchInstallation();
    }
  }, [id, activeTab]);

  useEffect(() => {
    const fetchMaterialDelivery = async () => {
      try {
        setMaterialDeliveryLoading(true);
        const res = await materialDeliveryAPI.get(id);

        if (res.status === 404) {
          setMaterialDelivery(null);
          setMaterialDeliveryDraft({
            changes: "", extra_material: "", structure_changes: "",
            electrical_delivered: false, structure_delivered: false,
            panel_delivered: false, comments: "",
          });
          return;
        }

        const data = res.data;
        setMaterialDelivery(data);
        setMaterialDeliveryDraft({
          changes: data.changes || "",
          extra_material: data.extra_material || "",
          structure_changes: data.structure_changes || "",
          electrical_delivered: data.electrical_delivered || false,
          structure_delivered: data.structure_delivered || false,
          panel_delivered: data.panel_delivered || false,
          comments: data.comments || "",
        });
      } catch (err) {
        setMaterialDelivery(null);
      } finally {
        setMaterialDeliveryLoading(false);
      }
    };

    if (id && activeTab === "material_delivery") {
      fetchMaterialDelivery();
    }
  }, [id, activeTab]);

  // ==========================================
  // HANDLERS - PROFILE
  // ==========================================
  const handleUpdate = async () => {
    if (!(await confirm("Save changes to this customer?"))) return;

    try {
      setProfileSaveLoading(true);
      const formData = new FormData();
      Object.keys(customer).forEach((key) => {
        if (customer[key] !== null && customer[key] !== undefined) {
          formData.append(key, customer[key]);
        }
      });
      if (profileImage) formData.append("profile_photo", profileImage);

      const res = await customersAPI.update(id, formData);
      setCustomer(res.data.customer);
      setIsEdit(false);
      setProfileImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await confirm("Delete this customer profile?"))) return;
    try {
      await customersAPI.remove(id);
      navigate("/customers");
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // HANDLERS - SITE VISIT
  // ==========================================
  const fetchSiteVisitData = async () => {
    try {
      const res = await siteVisitAPI.get(id);
      setSiteVisit(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 💡 FIX: പഴയ ഫയലുകൾ ഓവർറൈറ്റ് ചെയ്യാതെ മൾട്ടിപ്പിൾ ഫയലുകൾ അപ്പൻഡ് ചെയ്യുന്നു
  const handleSiteImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSiteImages((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setSiteImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationAutoFill = async () => {
    if (!navigator.geolocation) return;
    if (locationLoading) return;

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const addressDetails = data?.address || {};
          const placeName = data?.display_name || [
            addressDetails?.house_number, addressDetails?.road, addressDetails?.suburb,
            addressDetails?.city || addressDetails?.town || addressDetails?.village,
            addressDetails?.state, addressDetails?.country,
          ].filter(Boolean).join(", ");

          setSiteVisit((prev) => ({
            ...(prev || {}),
            location: placeName || `${latitude}, ${longitude}`,
          }));
          setLocationDetected(true);
        } catch (error) {
          console.error("Location fetch failed:", error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSiteSave = async () => {
    if (!(await confirm(siteVisit?.id ? "Save site visit updates?" : "Create this site visit record?"))) return;

    try {
      setSiteSaveLoading(true);
      const formData = new FormData();
      formData.append("customer_id", id);
      
      const fields = ["panel_capacity", "system_capacity", "feasibility", "comments", "project_cost", "location", "load_enhancement", "ownership_change"];
      fields.forEach(field => {
        if (siteVisit?.[field] !== undefined && siteVisit?.[field] !== null) {
          formData.append(field, siteVisit[field]);
        }
      });

      const files = ["new_quotation_file", "new_agreement_file", "new_aadhaar", "new_pan", "new_kseb_bill", "new_bank_passbook", "new_land_tax", "new_building_tax", "new_signature"];
      files.forEach(fileKey => {
        const apiKey = fileKey.replace("new_", "");
        if (siteVisit?.[fileKey]) formData.append(apiKey, siteVisit[fileKey]);
      });

      siteImages.forEach((file) => { if (file) formData.append("images", file); });
      
      // 💡 FIX: കണ്ടീഷൻ കളഞ്ഞ് എപ്പോഴും 'existing_images' സ്ട്രിങ് ആയി പാസ്സ് ചെയ്യുന്നു. ലിസ്റ്റ് കാലിയായാലും കറക്റ്റ് ആയി അപ്ഡേറ്റ് ആകും.
      formData.append("existing_images", JSON.stringify(existingImages));

      await siteVisitAPI.save(siteVisit?.id, formData);
      setSiteEdit(false);
      setSiteImages([]);
      fetchSiteVisitData();
    } catch (err) {
      console.error(err);
    } finally { setSiteSaveLoading(false); }
  };

  // ==========================================
  // HANDLERS - MNRE
  // ==========================================
  const handleMnreSave = async () => {
    if (!(await confirm(mnreProfile?.id ? "Save MNRE profile changes?" : "Create a new MNRE profile?"))) return;
    try {
      setMnreSaveLoading(true);
      const formData = new FormData();
      formData.append("customer_id", id);
      formData.append("enabled", mnreDraft?.enabled ? "true" : "false");

      if (mnreDraft?.mnre_status) formData.append("mnre_status", mnreDraft.mnre_status);
      if (mnreDraft?.comments) formData.append("comments", mnreDraft.comments);
      if (mnreDraft?.new_feasibility) formData.append("feasibility_file", mnreDraft.new_feasibility);
      if (mnreDraft?.new_ack) formData.append("ack_file", mnreDraft.new_ack);

      const response = await mnreAPI.save(id, formData);
      setMnreProfile(response.data);
      setMnreDraft(null);
      setMnreEdit(false);
    } catch (err) {
      console.error(err);
    } finally { setMnreSaveLoading(false); }
  };

  const handleMnreInstallationSave = async () => {
    if (!(await confirm(mnreInstallation?.id ? "Save MNRE installation updates?" : "Create MNRE installation details?"))) return;
    try {
      setMnreInstallationSaveLoading(true);
      const data = {
        id: mnreInstallation?.id,
        installation_status: mnreInstallationDraft?.installation_status || "",
        installation_comments: mnreInstallationDraft?.installation_comments || "",
        approval_status: mnreInstallationDraft?.approval_status || "",
        approval_comments: mnreInstallationDraft?.approval_comments || "",
        subsidy_status: mnreInstallationDraft?.subsidy_status || "",
        subsidy_comments: mnreInstallationDraft?.subsidy_comments || ""
      };
      const response = await mnreAPI.saveInstallation(id, data);
      setMnreInstallation(response.data);
      setMnreInstallationDraft(response.data);
      setMnreInstallationEdit(false);
    } catch (err) {
      console.error(err);
    } finally { setMnreInstallationSaveLoading(false); }
  };

  // ==========================================
  // HANDLERS - PAYMENTS
  // ==========================================
  const handlePaymentImageChange = (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    setPaymentImages((prev) => [...prev, ...files]);
  };

  const handleRemovePaymentImage = (index, type) => {
    if (type === "new") {
      setPaymentImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setExistingPaymentImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePaymentSave = async () => {
    if (!(await confirm(payment?.id ? "Save payment changes?" : "Create this payment record?"))) return;
    try {
      setPaymentSaveLoading(true);
      const formData = new FormData();
      formData.append("customer_id", id);
      formData.append("advance", paymentDraft?.advance || "0");
      formData.append("loan", paymentDraft?.loan || "0");
      formData.append("second", paymentDraft?.second || "0");
      formData.append("third", paymentDraft?.third || "0");
      if (paymentDraft?.comments) formData.append("comments", paymentDraft.comments);

      paymentImages.forEach((file) => { if (file) formData.append("files", file); });
      
      // 💡 FIX: എപ്പോഴും ലിസ്റ്റ് കറക്റ്റ് ആയി സ്ട്രിങ് ആക്കി ബാക്ക്എൻഡിലേക്ക് പാസ്സ് ചെയ്യുന്നു.
      formData.append("existing_images", JSON.stringify(existingPaymentImages));

      const response = await paymentAPI.save(id, formData, Boolean(payment?.id));
      const data = response.data;
      setPayment(data.payment);
      setPaymentEdit(false);
      setPaymentDraft(null);
      setPaymentImages([]);
      setExistingPaymentImages(data.payment.images || []);
    } catch (err) {
      console.error(err);
    } finally { setPaymentSaveLoading(false); }
  };

  const handlePaymentCancel = () => {
    setPaymentDraft(null);
    setPaymentEdit(false);
    setPaymentImages([]);
    setExistingPaymentImages(payment?.images || []);
  };

  const getPaymentTotal = (p) =>
    Number(p?.advance || 0) + Number(loanProfile?.total_loan_amount || 0) + Number(p?.second || 0) + Number(p?.third || 0);

  // ==========================================
  // HANDLERS - LOAN
  // ==========================================
  const handleLoanSave = async () => {
    if (!(await confirm(loanDraft?.id ? "Save loan details?" : "Create loan information?"))) return;
    try {
      setLoanSaveLoading(true);
      const formData = new FormData();
      const payload = {
        enabled: loanDraft?.enabled ?? false,
        status: loanDraft?.status || "Pending",
        submission: loanDraft?.submission || "",
        comments: loanDraft?.comments || "",
        extra_comments: loanDraft?.extra_comments || "",
        first_payment: loanDraft?.first_payment ?? 0,
        second_payment: loanDraft?.second_payment ?? 0,
        id: loanDraft?.id 
      };

      if (!payload.enabled) {
        formData.append("enabled", "false");
      } else {
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));
        if (loanDraft?.new_ack) formData.append("ack_file", loanDraft.new_ack);
      }

      const response = await loanAPI.save(id, formData);
      const data = response.data;
      setLoanProfile(data.loan);
      setLoanDraft(data.loan);
      setLoanEdit(false);
    } catch (err) { console.error(err); } finally { setLoanSaveLoading(false); }
  };

  // ==========================================
  // HANDLERS - KSEB & DCR
  // ==========================================
  const handleKsebEdit = () => { setKsebDraft({ ...ksebProfile }); setKsebEdit(true); };

  const handleKsebSave = async () => {
    if (!(await confirm("Save KSEB data?"))) return;
    try {
      setKsebSaveLoading(true);
      const data = {
        name_change: ksebDraft?.name_change || false,
        name_change_status: ksebDraft?.name_change_status || "",
        name_change_comment: ksebDraft?.name_change_comment || "",
        load_enhance: ksebDraft?.load_enhance || false,
        load_enhance_status: ksebDraft?.load_enhance_status || "",
        load_enhance_comment: ksebDraft?.load_enhance_comment || "",
        feasibility: ksebDraft?.feasibility || false,
        fee_paid: ksebDraft?.fee_paid || false,
      };
      await ksebAPI.save(id, data);
      setKsebProfile(data);
      setKsebEdit(false);
    } catch (err) {
      console.error(err);
    } finally { setKsebSaveLoading(false); }
  };

  const handleMaterialDeliveryEdit = () => {
    setMaterialDeliveryDraft({
      changes: materialDelivery?.changes || "",
      extra_material: materialDelivery?.extra_material || "",
      structure_changes: materialDelivery?.structure_changes || "",
      electrical_delivered: materialDelivery?.electrical_delivered || false,
      structure_delivered: materialDelivery?.structure_delivered || false,
      panel_delivered: materialDelivery?.panel_delivered || false,
      comments: materialDelivery?.comments || ""
    });
    setMaterialDeliveryEdit(true);
  };

  const handleMaterialDeliveryCancel = () => {
    setMaterialDeliveryEdit(false);
  };

  const handleMaterialDeliverySave = async () => {
    if (!(await confirm("Save material delivery updates?"))) return;
    try {
      setMaterialDeliveryLoading(true);
      const data = {
        changes: materialDeliveryDraft.changes || "",
        extra_material: materialDeliveryDraft.extra_material || "",
        structure_changes: materialDeliveryDraft.structure_changes || "",
        electrical_delivered: materialDeliveryDraft.electrical_delivered || false,
        structure_delivered: materialDeliveryDraft.structure_delivered || false,
        panel_delivered: materialDeliveryDraft.panel_delivered || false,
        comments: materialDeliveryDraft.comments || ""
      };
      await materialDeliveryAPI.save(id, data);
      setMaterialDelivery(data);
      setMaterialDeliveryEdit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setMaterialDeliveryLoading(false);
    }
  };

  const handleKsebRegistrationSave = async () => {
    if (!(await confirm(ksebRegistration?.id ? "Save KSEB registration updates?" : "Create KSEB registration?"))) return;
    try {
      const data = {
        registration_submitted: ksebRegistrationDraft?.registration_submitted || false,
        completion_submitted: ksebRegistrationDraft?.completion_submitted || false,
        agreement_submitted: ksebRegistrationDraft?.agreement_submitted || false,
        payment_done: ksebRegistrationDraft?.payment_done || false,
        plant_energized: ksebRegistrationDraft?.plant_energized || false,
        wifi: ksebRegistrationDraft?.wifi || false,
        wifi_configured: ksebRegistrationDraft?.wifi_configured || false,
        comments: ksebRegistrationDraft?.comments || ""
      };
      const response = await ksebRegistrationAPI.save(id, data, Boolean(ksebRegistration?.id));
      const responseData = response.data;
      setKsebRegistration(responseData.data || data);
      setKsebRegistrationDraft(responseData.data || data);
      setKsebRegistrationEdit(false);
    } catch (err) { console.error(err); }
  };

  const handleDcrSave = async () => {
    if (!(await confirm(dcr?.id ? "Save DCR changes?" : "Create DCR information?"))) return;
    try {
      const data = {
        certificate_received: dcrDraft?.certificate_received || false,
        certificate_claimed: dcrDraft?.certificate_claimed || false,
        certificate_sold: dcrDraft?.certificate_sold || false,
        comments: dcrDraft?.comments || ""
      };
      const response = await dcrAPI.save(id, data, Boolean(dcr?.id));
      const responseData = response.data;
      setDcr(responseData.data || data);
      setDcrDraft(responseData.data || data);
      setDcrEdit(false);
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // HANDLERS - SERVICE
  // ==========================================
  const handleServiceAdd = () => {
    setServiceForm({ date: "", images: [], existingImages: [], comments: "" });
    setServiceEditIndex(null);
    setServiceFormOpen(true);
  };

  const handleServiceEdit = (index) => {
    const s = services[index];
    setServiceForm({ date: s.date, images: [], existingImages: s.images || [], comments: s.comments });
    setServiceEditIndex(index);
    setServiceFormOpen(true);
  };

  const handleServiceDelete = async (serviceId) => {
    if (!(await confirm("Delete this service entry?"))) return;
    try {
      await serviceAPI.deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) { console.error(err); }
  };

  const handleServiceImageChange = (e) => {
    const files = Array.from(e.target.files);
    setServiceForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeServiceNewImage = (i) => {
    setServiceForm((prev) => ({ ...prev, images: prev.images.filter((_, index) => index !== i) }));
  };

  const removeServiceExistingImage = (i) => {
    setServiceForm((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, index) => index !== i) }));
  };

  const handleServiceSave = async () => {
    if (!(await confirm(serviceEditIndex !== null ? "Save service changes?" : "Create this service entry?"))) return;
    try {
      setServiceSaveLoading(true);
      const formData = new FormData();
      formData.append("date", serviceForm.date);
      formData.append("comments", serviceForm.comments);
      formData.append("existingImages", JSON.stringify(serviceForm.existingImages));
      serviceForm.images.forEach((img) => formData.append("images", img));

      if (serviceEditIndex !== null) {
        await serviceAPI.updateService(services[serviceEditIndex].id, formData);
      } else {
        await serviceAPI.createService(id, formData);
      }

      setServiceFormOpen(false);
      const { data } = await serviceAPI.getServices(id);
      setServices(data);
    } catch (err) { console.error(err); } finally { setServiceSaveLoading(false); }
  };

  // ==========================================
  // HANDLERS - INSTALLATION
  // ==========================================
  const handleInstallationSave = async () => {
    if (!(await confirm(installation?.id ? "Save installation updates?" : "Create installation details?"))) return;
    try {
      setInstallationLoading(true);
      const formData = new FormData();

      formData.append("electrical_installed", installationDraft?.electrical_installed || false);
      formData.append("electrical_comments", installationDraft?.electrical_comments || "");
      formData.append("structure_installed", installationDraft?.structure_installed || false);
      formData.append("structure_comments", installationDraft?.structure_comments || "");
      
      // 💡 FIX: ബാക്ക്എൻഡിലേക്ക് ശരിയായ കീയിൽ ലിസ്റ്റ് കറക്റ്റ് ആയി പാസ്സ് ചെയ്യുന്നു.
      formData.append("existingImages", JSON.stringify(existingGeoImages));

      if (installationDraft?.geo_images?.length > 0) {
        installationDraft.geo_images.forEach(file => {
          formData.append("geo_images", file);
        });
      }

      const response = await installationAPI.save(id, formData);
      const data = response.data;
      setInstallation(data);
      setInstallationDraft({
        electrical_installed: data.electrical_installed || false,
        electrical_comments: data.electrical_comments || "",
        structure_installed: data.structure_installed || false,
        structure_comments: data.structure_comments || "",
        geo_images: [],
      });

      setExistingGeoImages(data.geo_images || []);
      setInstallationEdit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setInstallationLoading(false);
    }
  };

  const handleGeoImageChange = (e) => {
    const files = Array.from(e.target.files);
    setInstallationDraft((prev) => ({
      ...prev,
      geo_images: [...(prev.geo_images || []), ...files],
    }));
  };

  const handleRemoveGeoImage = (index) => {
    setExistingGeoImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeInstallationNewImage = (index) => {
    setInstallationDraft((prev) => ({
      ...prev,
      geo_images: prev.geo_images.filter((_, i) => i !== index),
    }));
  };

  // ==========================================
  // VIEW LOGIC & RENDERING
  // ==========================================
  const address = [
    customer?.house_name, customer?.street, customer?.area, customer?.landmark,
    customer?.city, customer?.district, customer?.state, customer?.pincode
  ].filter(Boolean).join(", ");

  if (loading) return (
    <div className="loading-overlay">
      <div className="profile-spinner"></div>
      <p>Loading customer profile...</p>
    </div>
  );
  if (error) return <h3 style={{ color: "red" }}>{error}</h3>;
  if (!customer) return <h3>No customer found</h3>;

  return (
    <div className="customer-container">
      <div className="home-icon" onClick={() => navigate("/dashboard")}><FaHome /></div>

      <div className="customer-container">
        <div className="mobile-tab-trigger">
          <button type="button" onClick={() => setMenuOpen((prev) => !prev)} aria-label={isMenuOpen ? "Close tabs menu" : "Open tabs menu"}><FaBars/></button>
        </div>

        {isMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}
        <div className={`mobile-side-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="mobile-side-menu-header">
            <div>
              <button type="button" className="menu-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close tabs menu"><FaBars /></button>
            </div>
          </div>
          <div className="mobile-side-menu-list">
            {customerTabs.map((tab) => (
              <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => handleTabSelect(tab.key)}>{tab.label}</button>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div className="tab-menu">
            {customerTabs.map((tab) => (
              <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
            ))}
          </div>
        )}

        {/* ================= PROFILE TAB ================= */}
        {activeTab === "profile" && (
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-photo">
                <img src={profileImage ? URL.createObjectURL(profileImage) : renderMediaUrl(customer?.profile_photo)} alt="profile" />
                {isEdit && <input type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files[0])} />}
              </div>

              <div className="profile-basic">
                {!isEdit ? (
                  <>
                    <h2>{customer?.name}</h2>
                    <p>📞 {customer?.mobile}</p>
                    <p>📧 {customer?.email || "No email"}</p>
                    <p>📍 {address || customer?.place}</p>
                    <p>⚡ {customer?.capacity} KW</p>
                    <button className="edit-btn" onClick={() => setIsEdit(true)}>Edit Profile</button> 
                    <button className="cancel-btn" onClick={handleDelete}>Delete Profile</button>
                  </>
                ) : (
                  <div className="form-container">
                    <h2>Customer Details</h2>
                    <div className="form-section">
                      <h3>Basic Info</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input value={customer?.name || ""} onChange={(e) => /^[a-zA-Z\s]*$/.test(e.target.value) && setCustomer({ ...customer, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Mobile Number</label>
                          <input value={customer?.mobile || ""} onChange={(e) => /^\d*$/.test(e.target.value) && e.target.value.length <= 10 && setCustomer({ ...customer, mobile: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input value={customer?.email || ""} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Capacity</label>
                          <input value={customer?.capacity || ""} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setCustomer({ ...customer, capacity: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Location</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Place</label>
                          <input value={customer?.place || ""} onChange={(e) => setCustomer({ ...customer, place: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <input value={customer?.city || ""} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <select value={customer?.state || ""} onChange={(e) => setCustomer({ ...customer, state: e.target.value, district: "" })}>
                            <option value="">Select State</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>District</label>
                          {customer?.state === "Kerala" ? (
                            <select value={customer?.district || ""} onChange={(e) => setCustomer({ ...customer, district: e.target.value })}>
                              <option value="">Select District</option>
                              {stateDistrictMap.Kerala.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                          ) : (
                            <input value={customer?.district || ""} onChange={(e) => setCustomer({ ...customer, district: e.target.value })} />
                          )}
                        </div>
                        <div className="form-group">
                          <label>Pincode</label>
                          <input type="text" maxLength={6} value={customer?.pincode || ""} onChange={(e) => /^\d*$/.test(e.target.value) && setCustomer({ ...customer, pincode: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Address Details</h3>
                      <div className="form-grid">
                        <div className="form-group"><label>House Name</label><input value={customer?.house_name || ""} onChange={(e) => setCustomer({ ...customer, house_name: e.target.value })} /></div>
                        <div className="form-group"><label>Street</label><input value={customer?.street || ""} onChange={(e) => setCustomer({ ...customer, street: e.target.value })} /></div>
                        <div className="form-group"><label>Area</label><input value={customer?.area || ""} onChange={(e) => setCustomer({ ...customer, area: e.target.value })} /></div>
                        <div className="form-group"><label>Landmark</label><input value={customer?.landmark || ""} onChange={(e) => setCustomer({ ...customer, landmark: e.target.value })} /></div>
                      </div>
                    </div>

                    <div className="btn-group">
                      <button className="save-btn" onClick={handleUpdate} disabled={profileSaveLoading}>{profileSaveLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button>
                      <button className="cancel-btn" onClick={() => setIsEdit(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= SITE VISIT TAB ================= */}
        {activeTab === "site" && (
          <div className="module-form">
            <h2>Site Visit</h2>
            {!siteEdit && siteVisit ? (
              <div className="site-details">
                <h4>Site Visit Details</h4>
                <div className="detail-grid">
                  <div className="detail-item"><label>Customer Name:</label><span>{customer.name}</span></div>
                  <div className="detail-item"><label>Location:</label><span>{siteVisit.location ? <a href={getGoogleMapsUrl(siteVisit.location)} target="_blank" rel="noopener noreferrer">{siteVisit.location}</a> : "N/A"}</span></div>
                  <div className="detail-item"><label>Panel Capacity:</label><span>{siteVisit.panel_capacity} KW</span></div>
                  <div className="detail-item"><label>System Capacity:</label><span>{siteVisit.system_capacity} KW</span></div>
                  <div className="detail-item"><label>Feasibility:</label><span>{siteVisit.feasibility || "N/A"}</span></div>
                  <div className="detail-item"><label>Project Cost:</label><span>₹{siteVisit.project_cost || "0"}</span></div>
                  <div className="detail-item"><label>Load Enhancement:</label><span>{siteVisit.load_enhancement || "N/A"}</span></div>
                  <div className="detail-item"><label>Ownership Change:</label><span>{siteVisit.ownership_change || "N/A"}</span></div>
                </div>
                <div className="form-group"><label>Comments:</label><p className="comments-text">{siteVisit.comments || "No comments"}</p></div>
                <div className="form-section">
                  <h5>Files</h5>
                  <div className="doc-view">
                   {siteVisit.quotation_file && <a href={getPdfPreviewUrl(siteVisit.quotation_file)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 Quotation</a>}
                   {siteVisit.agreement_file && <a href={getPdfPreviewUrl(siteVisit.agreement_file)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 Agreement</a>}
                   </div>
                </div>
                <div className="form-section">
                  <h5>Documents</h5>
                  <div className="doc-view">
                    {["aadhaar", "pan", "kseb_bill", "bank_passbook", "land_tax", "building_tax", "signature"].map((docKey) => 
                      siteVisit[docKey] && <a key={docKey} href={getPdfPreviewUrl(siteVisit[docKey])} target="_blank" rel="noopener noreferrer" className="doc-link">📄 {docKey.toUpperCase().replace("_", " ")}</a>
                    )}
                  </div>
                </div>
                {siteVisit.images?.length > 0 && (
                  <div className="form-section">
                    <h5>Images</h5>
                    <div className="image-gallery">
                      {siteVisit.images.map((img, i) => (
                        <a key={i} href={renderMediaUrl(img)} target="_blank" rel="noopener noreferrer">
                          <img src={renderMediaUrl(img)} alt={`site-${i}`} className="gallery-image" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="btn-group"><button className="save-btn" onClick={() => setSiteEdit(true)}>Update Site Visit</button></div>
              </div>
            ) : !siteEdit && !siteVisit ? (
              <div className="no-record">
                <p>No site visit record exists for this customer.</p>
                <button className="save-btn" onClick={() => setSiteEdit(true)}>+ Create Site Visit</button>
              </div>
            ) : (
              <div className="module-form">
                <h4>{siteVisit ? "Update Site Visit" : "Create Site Visit"}</h4>
                <div className="form-grid">
                  <div className="form-group"><label>Panel Capacity (KW) *</label><input type="number" value={siteVisit?.panel_capacity || ""} onChange={(e) => setSiteVisit({...siteVisit, panel_capacity: e.target.value})} /></div>
                  <div className="form-group"><label>System Capacity (KW) *</label><input type="number" value={siteVisit?.system_capacity || ""} onChange={(e) => setSiteVisit({...siteVisit, system_capacity: e.target.value})} /></div>
                  <div className="form-group">
                    <label>Feasibility</label>
                    <div className="radio-group">
                      <label><input type="radio" name="feasibility" value="Yes" checked={siteVisit?.feasibility === "Yes"} onChange={(e) => setSiteVisit({...siteVisit, feasibility: e.target.value})} /> Yes</label>
                      <label><input type="radio" name="feasibility" value="No" checked={siteVisit?.feasibility === "No"} onChange={(e) => setSiteVisit({...siteVisit, feasibility: e.target.value})} /> No</label>
                    </div>
                  </div>
                  <div className="form-group"><label>Project Cost (₹)</label><input type="number" value={siteVisit?.project_cost || ""} onChange={(e) => setSiteVisit({...siteVisit, project_cost: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Comments</label><textarea value={siteVisit?.comments || ""} onChange={(e) => setSiteVisit({...siteVisit, comments: e.target.value})} rows="3" /></div>
                <div className="form-group">
                  <label>Location</label>
                  <div className="location-input-wrapper">
                    <input value={siteVisit?.location || ""} onChange={(e) => setSiteVisit((prev) => ({ ...(prev || {}), location: e.target.value }))} />
                    <button type="button" className="current-location-btn" onClick={handleLocationAutoFill} disabled={locationLoading}>
                      {locationLoading ? <span className="loader"></span> : <FaLocationCrosshairs className="location-icon" />}
                    </button>
                  </div>
                  <h5>File Uploads</h5>
                  <div className="form-grid">
                    <div className="form-group"><label>Quotation (PDF)</label><input type="file" accept=".pdf" onChange={(e) => setSiteVisit({...siteVisit, new_quotation_file: e.target.files[0]})} />{siteVisit?.quotation_file && <span className="file-info">✓ Already uploaded</span>}</div>
                    <div className="form-group"><label>Agreement (PDF)</label><input type="file" accept=".pdf" onChange={(e) => setSiteVisit({...siteVisit, new_agreement_file: e.target.files[0]})} />{siteVisit?.agreement_file && <span className="file-info">✓ Already uploaded</span>}</div>
                  </div>
                </div>
                <div className="form-section">
                  <h5>Document Uploads</h5>
                  <div className="form-grid">
                    {["aadhaar", "pan", "kseb_bill", "bank_passbook", "land_tax", "building_tax", "signature"].map((docKey) => (
                      <div className="form-group" key={docKey}>
                        <label>{docKey.toUpperCase().replace("_", " ")}</label>
                        <input type="file" onChange={(e) => setSiteVisit({...siteVisit, [`new_${docKey}`]: e.target.files[0]})} />
                        {siteVisit?.[docKey] && <span className="file-info">✓ Already uploaded</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-section">
                  <h5>Images</h5>
                  <div className="form-group"><input type="file" multiple onChange={handleSiteImageChange} /></div>
                  <div className="image-preview">
                    {siteImages.map((img, i) => (
                      <div key={i} className="image-wrapper">
                        <img src={URL.createObjectURL(img)} alt="preview" className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => handleRemoveNewImage(i)}>✖</button>
                      </div>
                    ))}
                    {existingImages.map((img, i) => (
                      <div key={i} className="image-wrapper">
                        <img src={renderMediaUrl(img)} alt={`existing-${i}`} className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => handleRemoveExistingImage(i)}>✖</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="btn-group">
                  <button className="save-btn" onClick={handleSiteSave} disabled={siteSaveLoading}>{siteSaveLoading ? <><span className="spinner"></span> Saving...</> : siteVisit ? "Save" : "Create Site Visit"}</button>
                  <button className="cancel-btn" onClick={() => { setSiteEdit(false); setSiteImages([]); setExistingImages(siteVisit?.images || []); fetchSiteVisitData(); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= MNRE PROFILE TAB ================= */}
        {activeTab === "mnre" && (
          <div className="module-form">
            {!mnreEdit ? (
              <div className="mnre-view-container">
                <div className="mnre-header"><h2>MNRE PROFILE</h2></div>
                <div className="site-details">
                  {!mnreProfile?.enabled ? (
                    <div className="mnre-disabled-message">
                      <p>MNRE Profile is Not Needed</p>
                      <button className="mnre-save-btn" onClick={() => { setMnreDraft({ enabled: true }); setMnreEdit(true); }}>Create MNRE Profile</button>
                    </div>
                  ) : (
                    <>
                      <div className="mnre-detail-grid">
                        <div className="mnre-detail-item"><label>MNRE Status:</label><span className={`mnre-status-badge ${mnreProfile?.mnre_status?.toLowerCase().replace(/\s/g, "-") || "not-set"}`}>{mnreProfile?.mnre_status || "Not Set"}</span></div>
                      </div>
                      <div className="mnre-comments"><label>Comments:</label><p>{mnreProfile?.comments || "No comments"}</p></div>
                      <div className="mnre-file-section">
                        <h5>Files</h5>
                        <div className="doc-view">
                          {mnreProfile?.feasibility_file && <a href={getPdfPreviewUrl(mnreProfile.feasibility_file)} target="_blank" rel="noopener noreferrer" className="doc-link"> Feasibility File</a>}
{mnreProfile?.ack_file && <a href={getPdfPreviewUrl(mnreProfile.ack_file)} target="_blank" rel="noopener noreferrer" className="doc-link"> Acknowledgment File</a>}
                          </div>
                      </div>
                      <div className="mnre-btn-group"><button className="mnre-save-btn" onClick={() => { setMnreDraft({ ...mnreProfile }); setMnreEdit(true); }}>Update MNRE Profile</button></div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="mnre-toggle">
                  <label>MNRE Profile</label>
                  <button className={mnreDraft?.enabled ? "mnre-on" : "mnre-off"} onClick={() => setMnreDraft({ ...mnreDraft, enabled: !mnreDraft?.enabled })}>{mnreDraft?.enabled ? "Needed" : "Not Needed"}</button>
                </div>
                {!mnreDraft?.enabled ? <div className="mnre-disabled-message"><p>MNRE Profile is Not Needed</p></div> : (
                  <div className="mnre-form">
                    <h3>MNRE PROFILE</h3>
                    <div className="mnre-drop-down-group">
                      <label>MNRE Status</label>
                      <select value={mnreDraft?.mnre_status || ""} onChange={(e) => setMnreDraft({ ...mnreDraft, mnre_status: e.target.value })}>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Partially Done">Partially Done</option>
                      </select>
                    </div>
                    <div className="mnre-form-group"><label>Comments</label><textarea value={mnreDraft?.comments || ""} onChange={(e) => setMnreDraft({ ...mnreDraft, comments: e.target.value })} /></div>
                    <div className="mnre-upload-section">
                      <div className="mnre-form-group"><label>Feasibility File</label><input type="file" onChange={(e) => setMnreDraft({ ...mnreDraft, new_feasibility: e.target.files[0] })} /></div>
                      <div className="mnre-form-group"><label>Acknowledgment File</label><input type="file" onChange={(e) => setMnreDraft({ ...mnreDraft, new_ack: e.target.files[0] })} /></div>
                    </div>
                  </div>
                )}
                <div className="mnre-btn-group">
                  {mnreDraft?.enabled && <button className="mnre-save-btn" onClick={handleMnreSave} disabled={mnreSaveLoading}>{mnreSaveLoading ? "Saving..." : "Save"}</button>}
                  <button className="mnre-cancel-btn" onClick={() => { setMnreDraft(null); setMnreEdit(false); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAYMENT TAB ================= */}
        {activeTab === "payment" && (
          <div className="module-form">
            <h2>Payment Flow</h2>
            {!paymentEdit ? (
              <div className="payment-view">
                <div className="detail-grid">
                  <div className="detail-item"><label>Advance Amount:</label><span>₹{payment?.advance || 0}</span></div>
                  <div className="detail-item"><label>Loan Amount:</label><span>₹{loanProfile?.total_loan_amount || 0}</span></div>
                  <div className="detail-item"><label>2nd Payment:</label><span>₹{payment?.second || 0}</span></div>
                  <div className="detail-item"><label>3rd Payment:</label><span>₹{payment?.third || 0}</span></div>
                  <div className="detail-item"><label>Project Cost:</label><span>₹{siteVisit?.project_cost || 0}</span></div>
                  <div className="detail-item"><label>Total Received Amount:</label><span>₹{payment?.total_received || 0}</span></div>
                  <div className="detail-item"><label>Balance Due:</label><span>₹{payment?.balance_due || 0}</span></div>
                </div>
                <div className="form-group"><label>Comments:</label><p>{payment?.comments || "No comments"}</p></div>
                <div className="form-section">
                  <h5>Payment Proofs</h5>
                  <div className="image-gallery">
                    {payment?.images?.length > 0 ? payment.images.map((file, i) => (
                      <a key={i} href={renderMediaUrl(file)} target="_blank" rel="noopener noreferrer">
                        {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={renderMediaUrl(file)} alt="" className="gallery-image" /> : `📄 Doc ${i + 1}`}
                      </a>
                    )) : <p>No payment proofs uploaded.</p>}
                  </div>
                </div>
                <div className="btn-group">
                  <button className="save-btn" onClick={() => { setPaymentDraft({ advance: payment?.advance || "", second: payment?.second || "", third: payment?.third || "", comments: payment?.comments || "" }); setPaymentEdit(true); }}>Update Payment Flow</button>
                </div>
              </div>
            ) : (
              <div className="payment-edit">
                <div className="form-grid">
                  <div className="form-group"><label>Advance Amount</label><input type="number" value={paymentDraft?.advance || ""} onChange={(e) => setPaymentDraft({ ...paymentDraft, advance: e.target.value })} /></div>
                  <div className="form-group"><label>2nd Payment</label><input type="number" value={paymentDraft?.second || ""} onChange={(e) => setPaymentDraft({ ...paymentDraft, second: e.target.value })} /></div>
                  <div className="form-group"><label>3rd Payment</label><input type="number" value={paymentDraft?.third || ""} onChange={(e) => setPaymentDraft({ ...paymentDraft, third: e.target.value })} /></div>
                  <div className="form-group"><label>Total</label><input disabled value={getPaymentTotal(paymentDraft)} /></div>
                </div>
                <div className="form-group"><label>Comments</label><textarea value={paymentDraft?.comments || ""} onChange={(e) => setPaymentDraft({ ...paymentDraft, comments: e.target.value })} /></div>
                <div className="form-section">
                  <h5>Payment Images</h5>
                  <div className="form-group"><input type="file" multiple accept="image/*" onChange={handlePaymentImageChange} /></div>
                  <div className="image-preview">
                    {paymentImages.map((img, i) => (
                      <div key={i} className="image-wrapper">
                        <img src={URL.createObjectURL(img)} alt="preview" className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => handleRemovePaymentImage(i, "new")}>✖</button>
                      </div>
                    ))}
                    {existingPaymentImages.map((img, i) => (
                      <div key={i} className="image-wrapper">
                        <img src={renderMediaUrl(img)} alt="" className="preview-image" />
                        <button type="button" className="remove-image-btn" onClick={() => handleRemovePaymentImage(i, "existing")}>✖</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="btn-group">
                  <button className="save-btn" onClick={handlePaymentSave} disabled={paymentSaveLoading}>Save</button>
                  <button className="cancel-btn" onClick={handlePaymentCancel}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= LOAN TAB ================= */}
        {activeTab === "loan" && (
          <div className="module-form">
            {!loanEdit ? (
              <div className="mnre-view-container">
                <h2>BANK LOAN</h2>
                {!loanProfile?.enabled ? (
                  <div className="mnre-disabled-message"><p>Bank Loan is Not Needed</p><button className="mnre-save-btn" onClick={() => { setLoanDraft({ enabled: true }); setLoanEdit(true); }}>Needed</button></div>
                ) : (
                  <>
                    <div className="mnre-detail-grid">
                      <div className="mnre-detail-item"><label>Jansamrit</label><span>{loanProfile?.status || "N/A"}</span></div>
                      <div className="mnre-detail-item"><label>Document Submission</label><span>{loanProfile?.submission || "N/A"}</span></div>
                    </div>
                    <div className="payment-view">
                      <h4>LOAN AMOUNT</h4>
                      <div className="detail-grid">
                        <div className="detail-item"><label>1st Payment</label><span>₹ {loanProfile?.first_payment || 0}</span></div>
                        <div className="detail-item"><label>2nd Payment</label><span>₹ {loanProfile?.second_payment || 0}</span></div>
                        <div className="detail-item total-loan"><label>Total Loan</label><span>₹ {(loanProfile?.first_payment || 0) + (loanProfile?.second_payment || 0)}</span></div>
                      </div>
                    </div>
                    <div className="mnre-comments"><label>Comments:</label><p>{loanProfile?.comments || "No comments"}</p></div>
                    <div className="loan-file-section">
                      <div className="doc-view">
                      {loanProfile?.ack_file && <a href={getPdfPreviewUrl(loanProfile.ack_file)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 Acknowledgment File</a>} 
                      </div>
                    </div>
                    <div className="mnre-btn-group">
                      <button className="mnre-save-btn" onClick={() => { setLoanDraft({ ...loanProfile }); setLoanEdit(true); }}>Update Bank Loan</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="mnre-toggle">
                  <label>Bank Loan</label>
                  <button className={loanDraft?.enabled ? "mnre-on" : "mnre-off"} onClick={() => setLoanDraft({ ...loanDraft, enabled: !loanDraft?.enabled })}>{loanDraft?.enabled ? "Needed" : "Not Needed"}</button>
                </div>
                {!loanDraft?.enabled ? <div className="mnre-disabled-message"><p>Bank Loan is Not Needed</p></div> : (
                  <div className="mnre-form">
                    <h2>BANK LOAN</h2>
                    <select value={loanDraft?.status || "Pending"} onChange={(e) => setLoanDraft({ ...loanDraft, status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div className="form-group"><label>Acknowledgment</label><input type="file" onChange={(e) => setLoanDraft({...loanDraft, new_ack: e.target.files[0]})} /></div>
                    <div className="form-group"><label>1st Payment</label><input type="number" value={loanDraft?.first_payment || ""} onChange={(e) => setLoanDraft({ ...loanDraft, first_payment: Number(e.target.value) })} /></div>
                    <div className="form-group"><label>2nd Payment</label><input type="number" value={loanDraft?.second_payment || ""} onChange={(e) => setLoanDraft({ ...loanDraft, second_payment: Number(e.target.value) })} /></div>
                  </div>
                )}
                <div className="mnre-btn-group">
                  {loanDraft?.enabled && <button className="mnre-save-btn" onClick={handleLoanSave} disabled={loanSaveLoading}>Save</button>}
                  <button className="mnre-cancel-btn" onClick={() => setLoanEdit(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

     {/* ================= KSEB TAB ================= */}
        {activeTab === "kseb" && (
          <div className="module-form">
            <div className="kseb-container">
              {!ksebEdit ? (
                <div>
                  <h2> KSEB DETAILS</h2>
                  {!ksebProfile ? (
                    <div className="kseb-create-message">
                      <p>No KSEB data found for this customer</p>
                      <button className="kseb-edit-btn" onClick={() => { setKsebDraft({ name_change: false, name_change_status: "Pending", name_change_comment: "", load_enhance: false, load_enhance_status: "Pending", load_enhance_comment: "", feasibility: false, fee_paid: false }); setKsebEdit(true); }}>Create KSEB Profile</button>
                    </div>
                  ) : (
                    <>
                      <div className="kseb-grid">
                        <div className="kseb-item"><label>Name Change</label><span className={`status-badge ${ksebProfile?.name_change_status?.toLowerCase().replace(/\s/g, "-") || "not-required"}`}>{ksebProfile?.name_change_status || "Not Required"}</span></div>
                        <div className="kseb-item"><label>Load Enhance</label><span className={`status-badge ${ksebProfile?.load_enhance_status?.toLowerCase().replace(/\s/g, "-") || "not-required"}`}>{ksebProfile?.load_enhance_status || "Not Required"}</span></div>
                        <div className="kseb-item"><label>Feasibility Submitted</label><span className={`status-badge ${ksebProfile?.feasibility ? "yes" : "no"}`}>{ksebProfile?.feasibility ? "Yes" : "No"}</span></div>
                        <div className="kseb-item"><label>Fee Paid</label><span className={`status-badge ${ksebProfile?.fee_paid ? "yes" : "no"}`}>{ksebProfile?.fee_paid ? "Yes" : "No"}</span></div>
                      </div>
                      <button className="kseb-edit-btn" onClick={handleKsebEdit}>Update KSEB Details</button>
                    </>
                  )}
                </div>
              ) : (
                <div className="kseb-edit">
                  <h2> KSEB DETAILS</h2>
                  
                  <div className="kseb-box">
                    <div className="kseb-header">
                      <label>
                        <input
                          type="checkbox"
                          checked={ksebDraft.name_change || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setKsebDraft((prev) => ({
                              ...prev,
                              name_change: checked,
                              name_change_status: checked ? prev.name_change_status : "",
                              name_change_comment: checked ? prev.name_change_comment : "",
                            }));
                          }}
                        />
                        Name Change Required
                      </label>
                    </div>

                    {ksebDraft.name_change && (
                      <div className="kseb-fields">
                        <select
                          value={ksebDraft.name_change_status || ""}
                          onChange={(e) =>
                            setKsebDraft((prev) => ({
                              ...prev,
                              name_change_status: e.target.value,
                            }))
                          }
                        >
                          <option value="" disabled hidden>Select Status</option>
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Comments"
                          value={ksebDraft.name_change_comment || ""}
                          onChange={(e) =>
                            setKsebDraft((prev) => ({
                              ...prev,
                              name_change_comment: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="kseb-box">
                    <div className="kseb-header">
                      <label>
                        <input
                          type="checkbox"
                          checked={ksebDraft.load_enhance || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setKsebDraft((prev) => ({
                              ...prev,
                              load_enhance: checked,
                              load_enhance_status: checked ? prev.load_enhance_status : "",
                              load_enhance_comment: checked ? prev.load_enhance_comment : "",
                            }));
                          }}
                        />
                        Load Enhance Required
                      </label>
                    </div>

                    {ksebDraft.load_enhance && (
                      <div className="kseb-fields">
                        <select
                          value={ksebDraft.load_enhance_status || ""}
                          onChange={(e) =>
                            setKsebDraft((prev) => ({
                              ...prev,
                              load_enhance_status: e.target.value,
                            }))
                          }
                        >
                          <option value="" disabled hidden>Select Status</option>
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Comments"
                          value={ksebDraft.load_enhance_comment || ""}
                          onChange={(e) =>
                            setKsebDraft((prev) => ({
                              ...prev,
                              load_enhance_comment: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="kseb-box"><div className="kseb-header"><label><input type="checkbox" checked={ksebDraft.feasibility || false} onChange={(e) => setKsebDraft({ ...ksebDraft, feasibility: e.target.checked })} /> Feasibility Request Submitted</label></div></div>
                  <div className="kseb-box"><div className="kseb-header"><label><input type="checkbox" checked={ksebDraft.fee_paid || false} onChange={(e) => setKsebDraft({ ...ksebDraft, fee_paid: e.target.checked })} /> Fee Paid</label></div></div>
                  <div className="kseb-btn-group"><button className="kseb-save-btn" onClick={handleKsebSave} disabled={ksebSaveLoading}>{ksebSaveLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button><button className="kseb-cancel-btn" onClick={() => setKsebEdit(false)}>Cancel</button></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MATERIAL DELIVERY ================= */}
        {activeTab === "material_delivery" && (
          <div className="module-form">
            <div className="material-delivery-container">
              {!materialDeliveryEdit ? (
                <div>
                  <h2> MATERIAL DELIVERY</h2>

                  {!materialDelivery ? (
                    <div className="material-delivery-create-message">
                      <p>No Material Delivery data found for this customer</p>
                      <button
                        className="kseb-edit-btn"
                        onClick={() => {
                          setMaterialDeliveryDraft({
                            changes: "",
                            extra_material: "",
                            structure_changes: "",
                            electrical_delivered: false,
                            structure_delivered: false,
                            panel_delivered: false,
                            comments: ""
                          });
                          setMaterialDeliveryEdit(true);
                        }}
                      >
                        Create Material Delivery
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="material-delivery-grid">
                        <div className="material-delivery-card">
                          <div className="card-header-row">
                            <h4>Changes</h4>
                          </div>
                          <p className="card-text">{materialDelivery.changes || 'No changes recorded.'}</p>
                        </div>

                        <div className="material-delivery-card">
                          <div className="card-header-row">
                            <h4>Extra Material</h4>
                          </div>
                          <p className="card-text">{materialDelivery.extra_material || 'No extra material details.'}</p>
                        </div>

                        <div className="material-delivery-card">
                          <div className="card-header-row">
                            <h4>Structure Changes</h4>
                          </div>
                          <p className="card-text">{materialDelivery.structure_changes || 'No structure change details.'}</p>
                        </div>

                        <div className="material-delivery-card">
                          <div className="card-header-row">
                            <h4>Comments</h4>
                          </div>
                          <p className="card-text">{materialDelivery.comments || 'No comments added.'}</p>
                        </div>
                      </div>

                      <div className="material-delivery-status-grid">
                        <div className="material-delivery-status-card">
                          <label>Electrical Materials Delivered</label>
                          <span className={`status-badge ${materialDelivery.electrical_delivered ? 'yes' : 'no'}`}>
                            {materialDelivery.electrical_delivered ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="material-delivery-status-card">
                          <label>Structure Material Delivered</label>
                          <span className={`status-badge ${materialDelivery.structure_delivered ? 'yes' : 'no'}`}>
                            {materialDelivery.structure_delivered ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="material-delivery-status-card">
                          <label>Panel Delivered</label>
                          <span className={`status-badge ${materialDelivery.panel_delivered ? 'yes' : 'no'}`}>
                            {materialDelivery.panel_delivered ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div className="material-delivery-btn-group kseb-btn-group">
                        <button className="kseb-edit-btn" onClick={handleMaterialDeliveryEdit}>Update Material Delivery</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2> MATERIAL DELIVERY</h2>
                  <div className="material-delivery-form">
                    <div className="material-delivery-form-grid">
                      <div className="form-group">
                        <label>Changes</label>
                        <textarea
                          value={materialDeliveryDraft.changes || ""}
                          onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, changes: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Extra Material</label>
                        <textarea
                          value={materialDeliveryDraft.extra_material || ""}
                          onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, extra_material: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Structure Changes</label>
                        <textarea
                          value={materialDeliveryDraft.structure_changes || ""}
                          onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, structure_changes: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="material-delivery-checkbox-grid">
                      <div className="material-delivery-checkbox-group">
                        <label className="material-delivery-checkbox-label">
                          <input
                            type="checkbox"
                            checked={materialDeliveryDraft.electrical_delivered || false}
                            onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, electrical_delivered: e.target.checked })}
                          />
                          Electrical Materials Delivered
                        </label>
                      </div>
                      <div className="material-delivery-checkbox-group">
                        <label className="material-delivery-checkbox-label">
                          <input
                            type="checkbox"
                            checked={materialDeliveryDraft.structure_delivered || false}
                            onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, structure_delivered: e.target.checked })}
                          />
                          Structure Material Delivered
                        </label>
                      </div>
                      <div className="material-delivery-checkbox-group">
                        <label className="material-delivery-checkbox-label">
                          <input
                            type="checkbox"
                            checked={materialDeliveryDraft.panel_delivered || false}
                            onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, panel_delivered: e.target.checked })}
                          />
                          Panel Delivered
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Comments</label>
                      <textarea
                        value={materialDeliveryDraft.comments || ""}
                        onChange={(e) => setMaterialDeliveryDraft({ ...materialDeliveryDraft, comments: e.target.value })}
                      />
                    </div>

                    <div className="material-delivery-btn-group kseb-btn-group">
                      <button className="kseb-save-btn" onClick={handleMaterialDeliverySave} disabled={materialDeliveryLoading}>{materialDeliveryLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button>
                      <button className="kseb-cancel-btn" onClick={handleMaterialDeliveryCancel}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= INSTALLATION TAB ================= */}
        {activeTab === "installation" && (
          <div className="module-form">
            <div className="installation-container">
              {installationLoading ? <p>Loading...<span className="spinner"></span></p> : !installationEdit ? (
                <div>
                  <h2> INSTALLATION DETAILS</h2>

                  {!installation ? (
                    <div className="installation-create-message">
                      <p>No Installation data found for this customer</p>
                      <button
                        className="installation-create-btn"
                        onClick={() => {
                          setInstallationDraft({
                            electrical_installed: false,
                            electrical_comments: "",
                            structure_installed: false,
                            structure_comments: "",
                            geo_images: []
                          });
                          setExistingGeoImages([]);
                          setInstallationEdit(true);
                        }}
                      >
                        Create Installation
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="installation-cards">
                        <div className="installation-card">
                          <div className="card-header">
                            <h4>Electrical Installation</h4>
                            <span className={`status-badge ${installation.electrical_installed ? 'completed' : 'pending'}`}>
                              {installation.electrical_installed ? '✓ Installed' : '✗ Not Installed'}
                            </span>
                          </div>
                          {installation.electrical_comments && (
                            <p className="card-text">{installation.electrical_comments}</p>
                          )}
                        </div>

                        <div className="installation-card">
                          <div className="card-header">
                            <h4>Structure Installation</h4>
                            <span className={`status-badge ${installation.structure_installed ? 'completed' : 'pending'}`}>
                              {installation.structure_installed ? '✓ Installed' : '✗ Not Installed'}
                            </span>
                          </div>
                          {installation.structure_comments && (
                            <p className="card-text">{installation.structure_comments}</p>
                          )}
                        </div>
                      </div>

                      {installation.geo_images && installation.geo_images.length > 0 && (
                        <div className="installation-images-section">
                          <h4>Geo Tagged Images</h4>
                          <div className="installation-images-grid">
                            {installation.geo_images.map((img, idx) => (
                              <div key={idx} className="installation-image-card">
                                {/* 💡 FIX: Modified to run safely with unified cloud resource path resolver helper */}
                                <a href={renderMediaUrl(img)} target="_blank" rel="noopener noreferrer">
                                  <img src={renderMediaUrl(img)} alt={`Geo Image ${idx + 1}`} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="installation-btn-group kseb-btn-group">
                        <button className="kseb-edit-btn" onClick={() => {
                          setInstallationDraft({
                            electrical_installed: installation.electrical_installed || false,
                            electrical_comments: installation.electrical_comments || "",
                            structure_installed: installation.structure_installed || false,
                            structure_comments: installation.structure_comments || "",
                            geo_images: []
                          });
                          setExistingGeoImages(installation.geo_images || []);
                          setInstallationEdit(true);
                        }}>Update Installation</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2> INSTALLATION DETAILS</h2>
                  <div className="installation-form">
                    <div className="installation-section">
                      <div className="installation-checkbox-group">
                        <label className="installation-checkbox-label">
                          <input
                            type="checkbox"
                            checked={installationDraft.electrical_installed || false}
                            onChange={(e) => {
                              setInstallationDraft({
                                ...installationDraft,
                                electrical_installed: e.target.checked,
                                electrical_comments: e.target.checked ? installationDraft.electrical_comments : ""
                              });
                            }}
                          />
                          Electrical Installation
                        </label>
                      </div>
                      {installationDraft.electrical_installed && (
                        <div className="form-group">
                          <label>Comments</label>
                          <textarea
                            placeholder="Enter electrical installation comments..."
                            value={installationDraft.electrical_comments || ""}
                            onChange={(e) => setInstallationDraft({ ...installationDraft, electrical_comments: e.target.value })}
                            rows="3"
                          />
                        </div>
                      )}
                    </div>

                    <div className="installation-section">
                      <div className="installation-checkbox-group">
                        <label className="installation-checkbox-label">
                          <input
                            type="checkbox"
                            checked={installationDraft.structure_installed || false}
                            onChange={(e) => {
                              setInstallationDraft({
                                ...installationDraft,
                                structure_installed: e.target.checked,
                                structure_comments: e.target.checked ? installationDraft.structure_comments : ""
                              });
                            }}
                          />
                          Structure Installation
                        </label>
                      </div>
                      {installationDraft.structure_installed && (
                        <div className="form-group">
                          <label>Comments</label>
                          <textarea
                            placeholder="Enter structure installation comments..."
                            value={installationDraft.structure_comments || ""}
                            onChange={(e) => setInstallationDraft({ ...installationDraft, structure_comments: e.target.value })}
                            rows="3"
                          />
                        </div>
                      )}
                    </div>

                    <div className="installation-images-section">
                      <h4>Geo Tagged Images</h4>
                      
                      {existingGeoImages.length > 0 && (
                        <div className="installation-existing-images">
                          <h5>Uploaded Images</h5>
                          <div className="installation-images-grid">
                            {existingGeoImages.map((img, idx) => (
                              <div key={`existing-${idx}`} className="installation-image-card">
                                {/* 💡 FIX: Connected with cloud media view helper inside editing gallery map */}
                                <img src={renderMediaUrl(img)} alt={`Existing Image ${idx + 1}`} />
                                <button
                                  type="button"
                                  className="installation-remove-btn"
                                  onClick={() => handleRemoveGeoImage(idx)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <label>Upload Images</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGeoImageChange}
                        />
                      </div>

                      {installationDraft.geo_images && installationDraft.geo_images.length > 0 && (
                        <div className="installation-new-images">
                          <h5>New Images</h5>
                          <div className="installation-images-grid">
                            {Array.from(installationDraft.geo_images).map((file, idx) => (
                              <div key={`new-${idx}`} className="installation-image-card">
                                <img src={URL.createObjectURL(file)} alt={`New Image ${idx + 1}`} />
                                <button type="button" className="installation-remove-btn" onClick={() => removeInstallationNewImage(idx)}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="installation-btn-group kseb-btn-group">
                      <button className="kseb-save-btn" onClick={handleInstallationSave} disabled={installationLoading}>{installationLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button>
                      <button className="kseb-cancel-btn" onClick={() => {
                        setInstallationEdit(false);
                        setInstallationDraft({
                          electrical_installed: installation?.electrical_installed || false,
                          electrical_comments: installation?.electrical_comments || "",
                          structure_installed: installation?.structure_installed || false,
                          structure_comments: installation?.structure_comments || "",
                          geo_images: []
                        });
                        setExistingGeoImages(installation?.geo_images || []);
                      }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= KSEB REGISTRATION TAB ================= */}
        {activeTab === "kseb_registration" && (
          <div className="module-form">
            <div className="kseb-registration-container">
              {ksebRegistrationLoading ? <p>Loading...</p> : !ksebRegistrationEdit ? (
                <div>
                  <h2> KSEB REGISTRATION & COMMISSIONING</h2>
                  {!ksebRegistration ? (
                    <div className="kseb-registration-create-message"><p>No data found</p><button className="kseb-registration-btn" onClick={() => { setKsebRegistrationDraft({ registration_submitted: false, completion_submitted: false, agreement_submitted: false, payment_done: false, plant_energized: false, wifi: false, wifi_configured: false, comments: "" }); setKsebRegistrationEdit(true); }}>Create</button></div>
                  ) : (
                    <>
                      <div className="kseb-registration-grid">
                        <div className="kseb-registration-item"><label>Registration Submitted</label><span className={ksebRegistration?.registration_submitted ? "status-yes" : "status-no"}>{ksebRegistration?.registration_submitted ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="kseb-registration-item"><label>Completion Submitted</label><span className={ksebRegistration?.completion_submitted ? "status-yes" : "status-no"}>{ksebRegistration?.completion_submitted ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="kseb-registration-item"><label>Agreement Submitted</label><span className={ksebRegistration?.agreement_submitted ? "status-yes" : "status-no"}>{ksebRegistration?.agreement_submitted ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="kseb-registration-item"><label>Payment Done</label><span className={ksebRegistration?.payment_done ? "status-yes" : "status-no"}>{ksebRegistration?.payment_done ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="kseb-registration-item"><label>Plant Energized</label><span className={ksebRegistration?.plant_energized ? "status-yes" : "status-no"}>{ksebRegistration?.plant_energized ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="kseb-registration-item"><label>WiFi</label><span className={ksebRegistration?.wifi ? "status-yes" : "status-no"}>{ksebRegistration?.wifi ? "✓ Yes" : "✗ No"}</span></div>
                        {ksebRegistration?.wifi && <div className="kseb-registration-item"><label>WiFi Configured</label><span className={ksebRegistration?.wifi_configured ? "status-yes" : "status-no"}>{ksebRegistration?.wifi_configured ? "✓ Yes" : "✗ No"}</span></div>}
                      </div>
                      {ksebRegistration?.comments && <div className="kseb-registration-comments"><label>Comments:</label><p>{ksebRegistration.comments}</p></div>}
                      <button className="kseb-registration-btn" onClick={() => { setKsebRegistrationDraft(ksebRegistration); setKsebRegistrationEdit(true); }}>Update Registration</button>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2>KSEB Registration</h2>
                  <div className="kseb-registration-form">
                    {['registration_submitted', 'completion_submitted', 'agreement_submitted', 'payment_done', 'plant_energized', 'wifi'].map(key => (
                      <div className="kseb-registration-toggle-group" key={key}><label className="kseb-registration-toggle-label"><input type="checkbox" checked={ksebRegistrationDraft?.[key] || false} onChange={(e) => setKsebRegistrationDraft({ ...ksebRegistrationDraft, [key]: e.target.checked, wifi_configured: key === 'wifi' && !e.target.checked ? false : ksebRegistrationDraft?.wifi_configured })} /> <span>{key.replace(/_/g, ' ').toUpperCase()}</span></label></div>
                    ))}
                    {ksebRegistrationDraft?.wifi && <div className="kseb-registration-toggle-group kseb-registration-conditional"><label className="kseb-registration-toggle-label"><input type="checkbox" checked={ksebRegistrationDraft?.wifi_configured || false} onChange={(e) => setKsebRegistrationDraft({ ...ksebRegistrationDraft, wifi_configured: e.target.checked })} /> <span>WiFi Configured</span></label></div>}
                    <div className="kseb-registration-textarea-group"><label>Comments</label><textarea value={ksebRegistrationDraft?.comments || ""} onChange={(e) => setKsebRegistrationDraft({ ...ksebRegistrationDraft, comments: e.target.value })} rows="4" /></div>
                    {error && <p className="kseb-registration-error">{error}</p>}
                  </div>
                  <div className="kseb-btn-group"><button className="kseb-save-btn" onClick={handleKsebRegistrationSave} disabled={ksebRegistrationLoading}>{ksebRegistrationLoading ? <><span className="spinner"></span> Saving...</> : ksebRegistration?.id ? "Save" : "Create"}</button><button className="kseb-cancel-btn" onClick={() => { setKsebRegistrationEdit(false); setKsebRegistrationDraft(ksebRegistration); }}>Cancel</button></div>  </div>
              )}
            </div>
          </div>
        )}

        {/* ================= DCR TAB ================= */}
        {activeTab === "dcr" && (
          <div className="module-form">
            <div className="dcr-container">
              {dcrLoading ? <p>Loading...</p> : !dcrEdit ? (
                <div>
                  <h2>DCR</h2>
                  {!dcr ? (
                    <div className="dcr-create-message"><p>No data</p><button className="dcr-btn" onClick={() => { setDcrDraft({ certificate_received: false, certificate_claimed: false, certificate_sold: false, comments: "" }); setDcrEdit(true); }}>Create DCR</button></div>
                  ) : (
                    <>
                      <div className="dcr-grid">
                        <div className="dcr-item"><label>Certificate Received</label><span className={dcr?.certificate_received ? "status-yes" : "status-no"}>{dcr?.certificate_received ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="dcr-item"><label>Certificate Claimed</label><span className={dcr?.certificate_claimed ? "status-yes" : "status-no"}>{dcr?.certificate_claimed ? "✓ Yes" : "✗ No"}</span></div>
                        <div className="dcr-item"><label>Certificate Sold</label><span className={dcr?.certificate_sold ? "status-yes" : "status-no"}>{dcr?.certificate_sold ? "✓ Yes" : "✗ No"}</span></div>
                      </div>
                      {dcr?.comments && <div className="dcr-comments"><label>Comments:</label><p>{dcr.comments}</p></div>}
                      <button className="dcr-btn" onClick={() => { setDcrDraft(dcr); setDcrEdit(true); }}>Update DCR</button>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2>Edit DCR</h2>
                  <div className="dcr-form">
                    {['certificate_received', 'certificate_claimed', 'certificate_sold'].map(key => (
                      <div className="dcr-toggle-group" key={key}><label className="dcr-toggle-label"><input type="checkbox" checked={dcrDraft?.[key] || false} onChange={(e) => setDcrDraft({ ...dcrDraft, [key]: e.target.checked })} /> <span>{key.replace(/_/g, ' ').toUpperCase()}</span></label></div>
                    ))}
                    <div className="dcr-textarea-group"><label>Comments</label><textarea value={dcrDraft?.comments || ""} onChange={(e) => setDcrDraft({ ...dcrDraft, comments: e.target.value })} rows="4" /></div>
                  </div>
                  <div className="kseb-btn-group">
                    <button className="kseb-save-btn" onClick={handleDcrSave} disabled={dcrLoading}>{dcrLoading ? <><span className="spinner"></span> Saving...</> : dcr?.id ? "Save" : "Create"}</button><button className="kseb-cancel-btn" onClick={() => { setDcrEdit(false); setDcrDraft(dcr); }}>Cancel</button></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MNRE INSTALLATION DETAILS TAB ================= */}
        {activeTab === "mnre_installation" && (
          <div className="module-form mnre-installation">
            <div className="form-header">
              <h2>MNRE Installation Details</h2>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!mnreInstallationEdit ? (
              // VIEW MODE
              <div className="mnre-sections">
                {/* Installation Status Section */}
                <div className="mnre-card">
                  <h3>Installation Status</h3>
                  <div className="status-display">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`status-badge ${
                          mnreInstallation?.installation_status
                            ?.toLowerCase()
                            .replace(/\s/g, "-") || "not-set"
                        }`}
                      >
                        {mnreInstallation?.installation_status || "Not set"}
                      </span>
                    </p>
                    <p><strong>Comments:</strong> {mnreInstallation?.installation_comments || "No comments"}</p>
                  </div>
                </div>

                {/* Approval Status Section */}
                <div className="mnre-card">
                  <h3>Approval Status</h3>
                  <div className="status-display">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`status-badge ${
                          mnreInstallation?.approval_status
                            ?.toLowerCase()
                            .replace(/\s/g, "-") || "not-set"
                        }`}
                      >
                        {mnreInstallation?.approval_status || "Not set"}
                      </span>
                    </p>
                    <p><strong>Comments:</strong> {mnreInstallation?.approval_comments || "No comments"}</p>
                  </div>
                </div>

                {/* Subsidy Status Section */}
                <div className="mnre-card">
                  <h3>Subsidy Status</h3>
                  <div className="status-display">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`status-badge ${
                          mnreInstallation?.subsidy_status
                            ?.toLowerCase()
                            .replace(/\s/g, "-") || "not-set"
                        }`}
                      >
                        {mnreInstallation?.subsidy_status || "Not set"}
                      </span>
                    </p>
                    <p><strong>Comments:</strong> {mnreInstallation?.subsidy_comments || "No comments"}</p>
                  </div>
                </div>
              </div>
            ) : (
              // EDIT MODE
              <div className="mnre-form">
                {/* Installation Status Section */}
                <div className="mnre-section">
                  <h3>Installation Status</h3>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={mnreInstallationDraft?.installation_status || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          installation_status: e.target.value
                        })
                      }
                      className="form-control"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Partially Done">Partially Done</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comments</label>
                    <textarea
                      value={mnreInstallationDraft?.installation_comments || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          installation_comments: e.target.value
                        })
                      }
                      className="form-control"
                      placeholder="Enter installation comments..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Approval Status Section */}
                <div className="mnre-section">
                  <h3>Approval Status</h3>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={mnreInstallationDraft?.approval_status || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          approval_status: e.target.value
                        })
                      }
                      className="form-control"
                    >
                      <option value="">-- Select --</option>
                      <option value="Approved">Approved</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comments</label>
                    <textarea
                      value={mnreInstallationDraft?.approval_comments || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          approval_comments: e.target.value
                        })
                      }
                      className="form-control"
                      placeholder="Enter approval comments..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Subsidy Status Section */}
                <div className="mnre-section">
                  <h3>Subsidy Status</h3>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={mnreInstallationDraft?.subsidy_status || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          subsidy_status: e.target.value
                        })
                      }
                      className="form-control"
                    >
                      <option value="">-- Select --</option>
                      <option value="Received">Received</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Comments</label>
                    <textarea
                      value={mnreInstallationDraft?.subsidy_comments || ""}
                      onChange={(e) =>
                        setMnreInstallationDraft({
                          ...mnreInstallationDraft,
                          subsidy_comments: e.target.value
                        })
                      }
                      className="form-control"
                      placeholder="Enter subsidy comments..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Centered at bottom */}
            <div className="mnre-actions">
              {!mnreInstallationEdit ? (
                <button
                  className="mnre-save-btn"
                  onClick={() => {
                    setMnreInstallationEdit(true);
                    if (!mnreInstallationDraft) {
                      setMnreInstallationDraft({
                        installation_status: mnreInstallation?.installation_status || "",
                        installation_comments: mnreInstallation?.installation_comments || "",
                        approval_status: mnreInstallation?.approval_status || "",
                        approval_comments: mnreInstallation?.approval_comments || "",
                        subsidy_status: mnreInstallation?.subsidy_status || "",
                        subsidy_comments: mnreInstallation?.subsidy_comments || ""
                      });
                    }
                  }}
                >
                  Update MNRE Installation Details
                </button>
              ) : (
                <>
                  <button className="mnre-save-btn" onClick={handleMnreInstallationSave} disabled={mnreInstallationSaveLoading}>{mnreInstallationSaveLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button>
                  <button
                    className="mnre-cancel-btn"
                    onClick={() => {
                      setMnreInstallationEdit(false);
                      setMnreInstallationDraft(mnreInstallation);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= SERVICE TAB ================= */}
        {activeTab === "service" && (
          <div className="service-section">
            <div className="service-header"><h2>Service</h2><button onClick={handleServiceAdd}>+ Add Service</button></div>
            {!serviceFormOpen ? (
              <div className="service-list">
                {/* 💡 FIX: Destructured the items into map first instead of directly pulling reversing array index to avoid Edit UI Populating index mismatch errors */}
                {[...services].reverse().map((s, mappedIndex) => {
                  // Find the authentic index matches from original state array
                  const originalIndex = services.findIndex(item => item.id === s.id);
                  return (
                    <div className="service-card" key={s.id}>
                      <h4>Service Logs</h4>
                      <p><b>Date:</b> {s.date}</p>
                      <p><b>Comments:</b> {s.comments}</p>
                      <div className="image-preview">
                        {s.images?.map((img, i) => (
                          // 💡 FIX: Using structural cloud image path wrapper to safely point rendering to Cloudinary URL
                          <a key={i} href={renderMediaUrl(img)} target="_blank" rel="noopener noreferrer">
                            <img src={renderMediaUrl(img)} alt="" />
                          </a>
                        ))}
                      </div>
                      <div className="actions">
                        <button onClick={() => handleServiceEdit(originalIndex)}>Edit</button>
                        <button onClick={() => handleServiceDelete(s.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="service-form">
                <h3>{serviceEditIndex !== null ? "Edit Service" : "Add Service"}</h3>
                <input type="date" value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })} />
                <input type="file" multiple onChange={handleServiceImageChange} />
                <div className="image-preview">
                  {serviceForm.existingImages.map((img, i) => (
                    <div className="img-box" key={i}>
                      {/* 💡 FIX: Used renderMediaUrl wrapper here inside editing screen maps */}
                      <img src={renderMediaUrl(img)} alt="" />
                      <span onClick={() => removeServiceExistingImage(i)}>❌</span>
                    </div>
                  ))}
                  {serviceForm.images.map((img, i) => (
                    <div className="img-box" key={i}>
                      <img src={URL.createObjectURL(img)} alt="" />
                      <span onClick={() => removeServiceNewImage(i)}>❌</span>
                    </div>
                  ))}
                </div>
                <textarea placeholder="Comments" value={serviceForm.comments} onChange={(e) => setServiceForm({ ...serviceForm, comments: e.target.value })} />
                <div className="form-actions">
                  <button onClick={handleServiceSave} disabled={serviceSaveLoading}>{serviceSaveLoading ? <><span className="spinner"></span> Saving...</> : "Save"}</button>
                  <button onClick={() => setServiceFormOpen(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
};

export default CustomerProfile;