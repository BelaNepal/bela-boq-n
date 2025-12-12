
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, Upload, X } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Admin email - configure this in your environment or directly here
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "belanepal.info@gmail.com";

// --- Translations ---
const translations: Record<Lang, any> = {
    en: {
        title: "Customer Information Form",
        subtitle: "Tell us about your dream project",
        personalInfo: "Personal Information",
        address: "Address",
        projectDetails: "Project Overview",
        siteDetails: "Site Details",
        requirements: "Requirements & Rooms",
        infrastructure: "Infrastructure & Access",
        other: "Other Details",
        submit: "Submit Information",
        submitting: "Submitting...",

        // Fields
        fullName: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        date: "Preferred Date",
        province: "Province",
        district: "District",
        municipality: "Municipality/VDC",
        ward: "Ward No",
        street: "Street/Tole",
        houseNo: "House No",

        projectType: "Project Type",
        projectTypeOther: "Other Project Type",
        landArea: "Land Area (e.g., 0-4-0-0)",
        squareFootage: "Approx. Square Footage",
        projectScope: "Project Scope",
        completionDate: "Target Completion Date",
        vision: "Your Vision / Dream",

        storeys: "Number of Storeys",
        storeysOther: "Other Storeys",
        topography: "Site Topography",
        drainage: "Water Drainage",
        direction: "Facing Direction",
        addlSiteInfo: "Additional Site Info",

        numRooms: "Total Number of Rooms",
        roomsList: "Room Details",
        addRoom: "Add Room",
        roomName: "Room Name/Type",
        roomSize: "Size/Dimensions",
        addlSpaces: "Additional Spaces (Parking, Garden, etc.)",

        roadSize: "Road Access Size (ft)",
        roadType: "Road Type",
        roadTypeOther: "Other Road Type",
        accessibility: "Accessibility Requirements",
        otherDetails: "Any Other Details",
        heardFrom: "How did you hear about us?",

        // Options
        residential: "Residential",
        commercial: "Commercial",
        mixed: "Mixed Use",
        flat: "Flat",
        sloped: "Sloped",
        teraced: "Terraced",
        east: "East",
        west: "West",
        north: "North",
        south: "South",
        blacktopped: "Blacktopped",
        gravel: "Gravel",
        earthen: "Earthen",
        facebook: "Facebook",
        friend: "Friend/Family",
        youtube: "YouTube",
        advertisement: "Advertisement",

        upload: "Upload Files (e.g. 2D/3D Images, Land Documents)",
        dropFiles: "Drop files here or click to upload",
    },
    np: {
        title: "ग्राहक जानकारी फारम",
        subtitle: "तपाईंको सपनाको परियोजना बारे हामीलाई बताउनुहोस्",
        personalInfo: "व्यक्तिगत विवरण",
        address: "ठेगाना",
        projectDetails: "परियोजना विवरण",
        siteDetails: "जग्गाको विवरण",
        requirements: "आवश्यकता र कोठाहरू",
        infrastructure: "पूर्वाधार र पहुँच",
        other: "अन्य विवरण",
        submit: "बुझाउनुहोस्",
        submitting: "बुझाउँदै...",

        fullName: "पुरा नाम",
        phone: "फोन नम्बर",
        email: "इमेल ठेगाना",
        date: "मिति",
        province: "प्रदेश",
        district: "जिल्ला",
        municipality: "नगरपालिका / गा.वि.स.",
        ward: "वडा नं.",
        street: "टोल / मार्ग",
        houseNo: "घर नं.",

        projectType: "परियोजनाको प्रकार",
        projectTypeOther: "अन्य प्रकार",
        landArea: "जग्गाको क्षेत्रफल (उदाहरण: ०-४-०-०)",
        squareFootage: "अनुमानित क्षेत्रफल (Sq. Ft)",
        projectScope: "परियोजनाको दायरा",
        completionDate: "लक्षित सम्पन्न मिति",
        vision: "तपाईंको सपना / परिकल्पना",

        storeys: "तल्ला संख्या",
        storeysOther: "अन्य तल्ला",
        topography: "जग्गाको बनावट",
        drainage: "पानीको निकास",
        direction: "मोहोडा",
        addlSiteInfo: "जग्गाको थप जानकारी",

        numRooms: "जम्मा कोठा संख्या",
        roomsList: "कोठा विवरण",
        addRoom: "कोठा थप्नुहोस्",
        roomName: "कोठाको नाम / प्रकार",
        roomSize: "साइज / आयाम",
        addlSpaces: "थप खाली ठाउँ (पार्किङ, बगैंचा आदि)",

        roadSize: "बाटोको चौडाइ (फिट)",
        roadType: "बाटोको प्रकार",
        roadTypeOther: "अन्य बाटोको प्रकार",
        accessibility: "पहुँच आवश्यकताहरू",
        otherDetails: "अन्य कुनै विवरण",
        heardFrom: "हाम्रो बारेमा कसरी थाहा पाउनुभयो?",

        residential: "आवासीय",
        commercial: "व्यावसायिक",
        mixed: "मिश्रित",
        flat: "समथर",
        sloped: "भिरालो",
        teraced: "कान्ला परेको",
        east: "पूर्व",
        west: "पश्चिम",
        north: "उत्तर",
        south: "दक्षिण",
        blacktopped: "कालोपत्रे",
        gravel: "ग्राभेल",
        earthen: "कच्ची",
        facebook: "फेसबुक",
        friend: "साथीभाई / परिवार",
        youtube: "युट्युब",
        advertisement: "विज्ञापन",

        upload: "फाइल अपलोड गर्नुहोस् (जस्तै: नक्सा, ३D फोटो)",
        dropFiles: "फाइल यहाँ राख्नुहोस् वा क्लिक गर्नुहोस्",
    }
};

type Lang = "en" | "np";

// --- Schema ---
const customerInfoSchema = z.object({
    full_name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email").min(1, "Email is required"),
    date: z.string().min(1, "Date is required"),

    province: z.string().optional(),
    district: z.string().optional(),
    municipality: z.string().optional(),
    ward: z.string().optional(),
    street: z.string().optional(),
    house_no: z.string().optional(),

    project_type: z.string().optional(),
    project_type_other: z.string().optional(),

    land_area: z.string().optional(),
    square_footage: z.string().optional(),
    project_scope: z.string().optional(),
    completion_date: z.string().optional(),
    vision: z.string().optional(),

    storeys: z.string().optional(),
    storeys_other: z.string().optional(),
    site_topography: z.string().optional(),
    water_drainage: z.string().optional(),
    direction: z.string().optional(),
    additional_site_info: z.string().optional(),

    num_rooms: z.string().optional(),
    rooms: z.array(z.object({
        name: z.string(),
        size: z.string(),
        storey: z.string().optional()
    })).optional(),
    additional_spaces: z.string().optional(),

    road_access_size: z.string().optional(),
    road_type: z.array(z.string()).optional(),
    road_type_other: z.string().optional(),

    accessibility: z.string().optional(),
    other_details: z.string().optional(),
    heard_from: z.array(z.string()).optional(),

    attachments: z.array(z.string()).optional(),
});

type CustomerInfoValues = z.infer<typeof customerInfoSchema>;

export default function CustomerInfo() {
    const [lang, setLang] = useState<Lang>("en");
    const t = translations[lang];
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const form = useForm<CustomerInfoValues>({
        resolver: zodResolver(customerInfoSchema),
        defaultValues: {
            road_type: [],
            heard_from: [],
            rooms: [{ name: "", size: "" }],
            project_type: "Residential",
            attachments: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "rooms"
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const newUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Sanitize filename to prevent 400 Bad Request
                const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${sanitizedName}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('customer_info')
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('customer_info')
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            setUploadedFiles(prev => [...prev, ...newUrls]);
            form.setValue('attachments', [...uploadedFiles, ...newUrls]);
            toast.success("Files uploaded successfully");
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error('Error uploading files');
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);
        form.setValue('attachments', newFiles);
    };

    const onSubmit = async (values: CustomerInfoValues) => {
        setIsSubmitting(true);
        try {
            // Sanitize values
            const sanitizedValues = Object.fromEntries(
                Object.entries(values).map(([key, value]) => {
                    if (value === "") return [key, null];
                    return [key, value];
                })
            );

            // 1. Save to Database
            const { error } = await supabase.from("customer_projects").insert([
                {
                    ...sanitizedValues,
                    attachments: uploadedFiles
                } as any
            ]);

            if (error) throw error;

            // 2. Prepare Emails
            const adminEmailHtml = `
        <h1>New Customer Inquiry</h1>
        <p><strong>Name:</strong> ${values.full_name}</p>
        <p><strong>Phone:</strong> ${values.phone}</p>
        <p><strong>Email:</strong> ${values.email}</p>
        <p><strong>Project Type:</strong> ${values.project_type}</p>
        <hr/>
        <p><a href="https://bela-boq-n.vercel.app/admin/customer-info">View Full Details in Admin Panel</a></p>
      `;

            const customerEmailHtml = `
        <h1>Namaste ${values.full_name},</h1>
        <p>Thank you for contacting Bela Nepal. We have received your project details and dream vision.</p>
        <p>Our team will review your information and get back to you shortly.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Bela Nepal Team</strong></p>
      `;

            // 3. Send Email to Admin (non-blocking)
            try {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: ADMIN_EMAIL,
                        subject: `New Inquiry: ${values.full_name}`,
                        html: adminEmailHtml
                    }
                });
            } catch (emailError) {
                console.error('Failed to send admin notification:', emailError);
                // Don't block form submission if email fails
            }

            // 4. Send "Thank You" to Customer (non-blocking)
            try {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: values.email,
                        subject: "Thank you for contacting Bela Nepal",
                        html: customerEmailHtml
                    }
                });
            } catch (emailError) {
                console.error('Failed to send customer confirmation:', emailError);
                // Don't block form submission if email fails
            }

            toast.success("Form submitted successfully!");
            form.reset();
            setUploadedFiles([]);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit form. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckboxChange = (field: any, value: string, checked: boolean) => {
        const current = field.value || [];
        if (checked) {
            field.onChange([...current, value]);
        } else {
            field.onChange(current.filter((v: string) => v !== value));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header with Language Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-sm border">
                        <span className={`text-sm font-medium ${lang === 'en' ? 'text-primary' : 'text-gray-400'}`}>ENG</span>
                        <Switch
                            checked={lang === 'np'}
                            onCheckedChange={(c) => setLang(c ? 'np' : 'en')}
                        />
                        <span className={`text-sm font-medium ${lang === 'np' ? 'text-primary' : 'text-gray-400'}`}>NEP</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {t.title}
                    </h1>
                    <p className="text-gray-500 text-lg">{t.subtitle}</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Personal Info */}
                    <Card className="border-t-4 border-t-blue-500 shadow-lg">
                        <CardHeader><CardTitle>{t.personalInfo}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>{t.fullName} *</Label>
                                <Input {...form.register("full_name")} placeholder={t.fullName} />
                                {form.formState.errors.full_name && <p className="text-red-500 text-sm">{form.formState.errors.full_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t.phone} *</Label>
                                <Input {...form.register("phone")} placeholder={t.phone} />
                                {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t.email} *</Label>
                                <Input type="email" {...form.register("email")} placeholder={t.email} />
                                {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t.date} *</Label>
                                <Input type="date" {...form.register("date")} />
                                {form.formState.errors.date && <p className="text-red-500 text-sm">{form.formState.errors.date.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.address}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2"><Label>{t.province}</Label><Input {...form.register("province")} /></div>
                            <div className="space-y-2"><Label>{t.district}</Label><Input {...form.register("district")} /></div>
                            <div className="space-y-2"><Label>{t.municipality}</Label><Input {...form.register("municipality")} /></div>
                            <div className="space-y-2"><Label>{t.ward}</Label><Input {...form.register("ward")} /></div>
                            <div className="space-y-2"><Label>{t.street}</Label><Input {...form.register("street")} /></div>
                            <div className="space-y-2"><Label>{t.houseNo}</Label><Input {...form.register("house_no")} /></div>
                        </CardContent>
                    </Card>

                    {/* Project Overview */}
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.projectDetails}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>{t.projectType}</Label>
                                    <Controller
                                        name="project_type"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Residential">{t.residential}</SelectItem>
                                                    <SelectItem value="Commercial">{t.commercial}</SelectItem>
                                                    <SelectItem value="Mixed Use">{t.mixed}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2"><Label>{t.projectTypeOther}</Label><Input {...form.register("project_type_other")} /></div>
                                <div className="space-y-2"><Label>{t.landArea}</Label><Input {...form.register("land_area")} /></div>
                                <div className="space-y-2"><Label>{t.squareFootage}</Label><Input {...form.register("square_footage")} /></div>
                                <div className="space-y-2"><Label>{t.projectScope}</Label><Input {...form.register("project_scope")} /></div>
                                <div className="space-y-2"><Label>{t.completionDate}</Label><Input type="date" {...form.register("completion_date")} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t.vision}</Label>
                                <Textarea {...form.register("vision")} className="min-h-[100px]" placeholder="Describe your dream project..." />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Site Details */}
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.siteDetails}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label>{t.storeys}</Label><Input {...form.register("storeys")} /></div>
                            <div className="space-y-2"><Label>{t.storeysOther}</Label><Input {...form.register("storeys_other")} /></div>

                            <div className="space-y-2">
                                <Label>{t.topography}</Label>
                                <Controller
                                    name="site_topography"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Flat">{t.flat}</SelectItem>
                                                <SelectItem value="Sloped">{t.sloped}</SelectItem>
                                                <SelectItem value="Terraced">{t.teraced}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-2"><Label>{t.drainage}</Label><Input {...form.register("water_drainage")} /></div>

                            <div className="space-y-2">
                                <Label>{t.direction}</Label>
                                <Controller
                                    name="direction"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="East">{t.east}</SelectItem>
                                                <SelectItem value="West">{t.west}</SelectItem>
                                                <SelectItem value="North">{t.north}</SelectItem>
                                                <SelectItem value="South">{t.south}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2"><Label>{t.addlSiteInfo}</Label><Textarea {...form.register("additional_site_info")} /></div>
                        </CardContent>
                    </Card>

                    {/* Requirements & Rooms */}
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.requirements}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2"><Label>{t.numRooms}</Label><Input {...form.register("num_rooms")} /></div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-medium">{t.roomsList}</Label>
                                </div>

                                {/* Logic: If 'storeys' is a number > 0, show sections. Else show default list. */}
                                {(() => {
                                    const storeyCount = parseInt(form.watch("storeys") || "0");

                                    // If no valid storey count, show default single list
                                    if (!storeyCount || isNaN(storeyCount) || storeyCount <= 0) {
                                        return (
                                            <div className="space-y-4">
                                                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", size: "" })}>
                                                    <Plus className="w-4 h-4 mr-2" /> {t.addRoom}
                                                </Button>
                                                {fields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-4 items-end bg-gray-50 p-3 rounded-md animate-in fade-in-0 slide-in-from-top-3">
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs">{t.roomName}</Label>
                                                            <Input {...form.register(`rooms.${index}.name` as const)} placeholder="e.g. Master Bedroom" />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs">{t.roomSize}</Label>
                                                            <Input {...form.register(`rooms.${index}.size` as const)} placeholder="e.g. 12x14" />
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => remove(index)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }

                                    // If storey count exists, render sections
                                    return (
                                        <div className="space-y-8">
                                            {Array.from({ length: storeyCount }).map((_, i) => {
                                                const storeyLabel = `Storey ${i + 1}`;
                                                // Filter fields that belong to this storey (for display/removal logic, we need to be careful with indices)
                                                // Actually, standard useFieldArray maps over ALL fields. We need to selectively show/hide or manage indices.
                                                // Easier approach: Just render all fields, but visually group them? 
                                                // No, if we want "Add Room to Storey 1", we need to append with storey:"Storey 1".
                                                // Showing them is tricky because `fields` is a flat array.
                                                // We will map over `fields` and only show those matching the storey.

                                                return (
                                                    <div key={i} className="border rounded-md p-4 bg-gray-50/50">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">{storeyLabel}</h4>
                                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", size: "", storey: storeyLabel })}>
                                                                <Plus className="w-4 h-4 mr-2" /> Add Room to {storeyLabel}
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {fields.map((field, index) => {
                                                                // Only show if storey matches OR if storey is undefined and this is the first storey (fallback)
                                                                const itemStorey = (form.getValues(`rooms.${index}.storey`));
                                                                // Note: fields[index] value might be stale, use getValues or watch.
                                                                // Actually field object has the default values from when it was created?
                                                                // Let's rely on the field.storey if it was set during append.
                                                                // If existing fields have no storey, maybe show them in 'Storey 1'?
                                                                const isMatch = itemStorey === storeyLabel || (!itemStorey && i === 0);

                                                                if (!isMatch) return null;

                                                                return (
                                                                    <div key={field.id} className="flex gap-4 items-end bg-white p-3 rounded-md border shadow-sm">
                                                                        <div className="flex-1 space-y-1">
                                                                            <Label className="text-xs">{t.roomName}</Label>
                                                                            <Input {...form.register(`rooms.${index}.name` as const)} placeholder="e.g. Bedroom" />
                                                                        </div>
                                                                        <div className="flex-1 space-y-1">
                                                                            <Label className="text-xs">{t.roomSize}</Label>
                                                                            <Input {...form.register(`rooms.${index}.size` as const)} placeholder="e.g. 10x12" />
                                                                        </div>
                                                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => remove(index)}>
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                            {/* Show message if no rooms in this storey */}
                                                            {fields.filter((_, idx) => {
                                                                const s = form.getValues(`rooms.${idx}.storey`);
                                                                return s === storeyLabel || (!s && i === 0);
                                                            }).length === 0 && (
                                                                    <p className="text-xs text-gray-400 italic text-center py-2">No rooms added yet for {storeyLabel}</p>
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="space-y-2"><Label>{t.addlSpaces}</Label><Textarea {...form.register("additional_spaces")} /></div>
                            <div className="space-y-2"><Label>{t.accessibility}</Label><Textarea {...form.register("accessibility")} /></div>
                        </CardContent>
                    </Card>

                    {/* Infrastructure & Other */}
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.infrastructure}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>{t.roadSize}</Label><Input {...form.register("road_access_size")} /></div>
                                <div className="space-y-2"><Label>{t.roadTypeOther}</Label><Input {...form.register("road_type_other")} /></div>
                            </div>

                            <div className="space-y-2">
                                <Label className="block mb-2">{t.roadType}</Label>
                                <Controller
                                    name="road_type"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex flex-wrap gap-4">
                                            {[t.blacktopped, t.gravel, t.earthen].map((type) => (
                                                <div key={type} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={field.value?.includes(type)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(field, type, checked as boolean)}
                                                    />
                                                    <span className="text-sm font-medium">{type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader><CardTitle>{t.other}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="block mb-2">{t.heardFrom}</Label>
                                <Controller
                                    name="heard_from"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex flex-wrap gap-4">
                                            {[t.facebook, t.friend, t.youtube, t.advertisement].map((type) => (
                                                <div key={type} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={field.value?.includes(type)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(field, type, checked as boolean)}
                                                    />
                                                    <span className="text-sm font-medium">{type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="space-y-2"><Label>{t.otherDetails}</Label><Textarea {...form.register("other_details")} /></div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">{t.upload}</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <p className="text-sm text-gray-600">{uploading ? "Uploading..." : t.dropFiles}</p>
                                    </div>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {uploadedFiles.map((url, index) => (
                                            <div key={index} className="relative group border rounded-md p-2">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="block text-xs truncate text-blue-600 hover:underline">
                                                    File {index + 1}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pt-4 pb-12">
                        <Button type="submit" size="lg" className="w-full text-lg h-12 bg-[#EF7E1E] hover:bg-[#d66c15]" disabled={isSubmitting}>
                            {isSubmitting ? t.submitting : t.submit}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
