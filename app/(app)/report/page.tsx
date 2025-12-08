'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Building2, ChevronDown, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function ReportPage() {
    const router = useRouter();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [userId, setUserId] = useState<string | null>(null);

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        getUser();
    }, []);

    const categories = [
        'Road and Infrastructure',
        'Street Lighting',
        'Waste Management',
        'Water and Drainage',
        'Public Safety',
        'Noise Complaint',
        'Other'
    ];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setValidationErrors(prev => ({ ...prev, image: 'Image must be less than 10MB' }));
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setValidationErrors(prev => ({ ...prev, image: 'File must be an image' }));
                return;
            }

            setImageFile(file);
            setValidationErrors(prev => ({ ...prev, image: '' }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!title.trim()) {
            errors.title = 'Title is required';
        } else if (title.trim().length < 5) {
            errors.title = 'Title must be at least 5 characters';
        }

        if (!category) {
            errors.category = 'Please select a category';
        }

        if (!location.trim()) {
            errors.location = 'Location is required';
        }

        if (!description.trim()) {
            errors.description = 'Description is required';
        } else if (description.trim().length < 20) {
            errors.description = 'Description must be at least 20 characters';
        }

        if (contactNumber && !/^(\+639|09)\d{9}$/.test(contactNumber.replace(/\s/g, ''))) {
            errors.contactNumber = 'Invalid Philippine mobile number format';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setError(null);
        setSuccess(false);

        // Validate form
        if (!validateForm()) {
            setError('Please fix the errors in the form');
            return;
        }

        // Ensure user is authenticated
        if (!userId) {
            setError('You must be logged in to submit a report');
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            // Verify user is still authenticated
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) {
                throw new Error('Authentication required. Please log in again.');
            }

            // Check if user has a profile (required for foreign key constraint)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError) {
                throw new Error(`User profile not found: ${profileError.message}. Please complete your profile setup.`);
            }

            if (!profileData) {
                throw new Error('User profile not found. Please complete your profile setup.');
            }

            let imagePath = null;

            // Upload image to Supabase Storage if present
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `reports/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('report-image')
                    .upload(filePath, imageFile);
                if (uploadError) {
                    throw new Error(`Image upload failed: ${uploadError.message}`);
                }

                // Get the public URL for the uploaded image
                const { data: { publicUrl } } = supabase.storage
                    .from('report-image')
                    .getPublicUrl(filePath);

                imagePath = publicUrl;
            }

            // Insert report into database with authenticated user's ID
            const insertData = {
                title: title.trim(),
                category,
                location: location.trim(),
                content: description.trim(),
                user_id: currentUser.id,
                status: 'pending',
            };

            const { data: complaintData, error: insertError } = await supabase
                .from('complaints')
                .insert(insertData)
                .select()
                .single();

            if (insertError) {
                throw new Error(`Failed to submit report: ${insertError.message}`);
            }

            if (!complaintData) {
                throw new Error('Failed to retrieve submitted report data');
            }

            const complaintId = complaintData.id;

            // Only insert picture if an image was uploaded
            if (imagePath) {
                const { data: pictureData, error: pictureError } = await supabase
                    .from('pictures')
                    .insert({
                        image_path: imagePath,
                        parent_type: 'complaint',
                        parent_id: complaintId,
                    })
                    .select()
                    .single();

                if (pictureError) {
                    throw new Error(`Failed to insert picture: ${pictureError.message}`);
                }

                if (!pictureData) {
                    throw new Error('Failed to retrieve picture data');
                }

                const pictureId = pictureData.id;

                const { error: linkError } = await supabase
                    .from('complaint_pictures')
                    .insert({
                        complaint_id: complaintId,
                        picture_id: pictureId,
                    });

                if (linkError) {
                    throw new Error(`Failed to link complaint and picture: ${linkError.message}`);
                }
            }

            setSuccess(true);

            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error: unknown) {
            console.error('Error submitting report:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="Report an Issue"
                showNotifications={false}
            />

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="mb-6 text-sm text-primary font-medium flex items-center gap-2 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>

                {/* Error Message */}
                {error && (
                    <Card className="mb-4 p-4 border-red-500 bg-red-50">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-red-900">Error</h4>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Success Message */}
                {success && (
                    <Card className="mb-4 p-4 border-green-500 bg-green-50">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-green-900">Success!</h4>
                                <p className="text-sm text-green-700">Your report has been submitted successfully. Redirecting...</p>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">New Issue Report</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Please fill out the form below to report an issue.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Report Information Section */}
                        <div className="mb-6">
                            <button
                                type="button"
                                className="w-full bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4 flex items-center justify-center"
                            >
                                <span className="font-semibold text-foreground">Report Information</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Category Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-base font-medium">
                                    Category of Issue <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        className={`w-full p-3 border rounded-lg text-left flex items-center justify-between hover:border-primary/50 transition-colors ${validationErrors.category ? 'border-red-500' : 'border-border'
                                            }`}
                                    >
                                        <span className={category ? 'text-foreground' : 'text-muted-foreground'}>
                                            {category || 'Select category'}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showCategoryDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(cat);
                                                        setShowCategoryDropdown(false);
                                                        setValidationErrors(prev => ({ ...prev, category: '' }));
                                                    }}
                                                    className="w-full p-3 text-left hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {validationErrors.category && (
                                    <p className="text-sm text-red-500">{validationErrors.category}</p>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-base font-medium">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Enter a brief title for the complaint"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, title: '' }));
                                    }}
                                    className={`h-12 ${validationErrors.title ? 'border-red-500' : ''
                                        }`}
                                />
                                {validationErrors.title && (
                                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-base font-medium">
                                    Location <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder="Enter specific location or address"
                                    value={location}
                                    onChange={(e) => {
                                        setLocation(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, location: '' }));
                                    }}
                                    className={`h-12 ${validationErrors.location ? 'border-red-500' : ''
                                        }`}
                                />
                                {validationErrors.location && (
                                    <p className="text-sm text-red-500">{validationErrors.location}</p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="report-image" className="text-base font-medium">
                                    Upload Photo (Optional)
                                </Label>
                                <div className={`border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors ${validationErrors.image ? 'border-red-500' : 'border-border'
                                    }`}>
                                    {imagePreview ? (
                                        <div className="relative">
                                            <div className="relative w-full h-64">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Selected"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setImageFile(null);
                                                    setValidationErrors(prev => ({ ...prev, image: '' }));
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Remove Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="report-image"
                                            className="flex flex-col items-center cursor-pointer"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                <Upload className="w-10 h-10 text-primary" />
                                            </div>
                                            <p className="text-base font-medium text-foreground mb-1">
                                                Click to upload supporting image
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PNG, JPG up to 10MB
                                            </p>
                                            <input
                                                id="report-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                                {validationErrors.image && (
                                    <p className="text-sm text-red-500">{validationErrors.image}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-base font-medium">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Please describe the issue in detail (minimum 20 characters)..."
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, description: '' }));
                                    }}
                                    className={`min-h-[150px] resize-none ${validationErrors.description ? 'border-red-500' : ''
                                        }`}
                                />
                                <div className="flex justify-between items-center">
                                    {validationErrors.description ? (
                                        <p className="text-sm text-red-500">{validationErrors.description}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {description.length} characters
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div className="mt-8 mb-4">
                                <div className="bg-secondary/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-foreground">Contact Information</h3>
                                </div>
                            </div>

                            {/* Mobile Number */}
                            <div className="space-y-2">
                                <Label htmlFor="contact" className="text-base font-medium">
                                    Mobile No. (Optional)
                                </Label>
                                <Input
                                    id="contact"
                                    type="tel"
                                    placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                                    value={contactNumber}
                                    onChange={(e) => {
                                        setContactNumber(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, contactNumber: '' }));
                                    }}
                                    className={`h-12 ${validationErrors.contactNumber ? 'border-red-500' : ''
                                        }`}
                                />
                                {validationErrors.contactNumber && (
                                    <p className="text-sm text-red-500">{validationErrors.contactNumber}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                                    disabled={isLoading || success}
                                >
                                    {isLoading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Report'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
