'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, AlertCircle, CheckCircle, Loader2, Eye, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default function CreateArticlePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Validate files
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                setValidationErrors(prev => ({ ...prev, images: 'Each image must be less than 10MB' }));
                return;
            }
            if (!file.type.startsWith('image/')) {
                setValidationErrors(prev => ({ ...prev, images: 'Only image files are allowed' }));
                return;
            }
        }

        setImageFiles(prev => [...prev, ...files]);
        setValidationErrors(prev => ({ ...prev, images: '' }));

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!title.trim()) {
            errors.title = 'Title is required';
        } else if (title.trim().length < 10) {
            errors.title = 'Title must be at least 10 characters';
        }

        if (!content.trim()) {
            errors.content = 'Content is required';
        } else if (content.trim().length < 50) {
            errors.content = 'Content must be at least 50 characters';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!validateForm()) {
            setError('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            // Verify user is admin
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Authentication required. Please log in again.');
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('user_roles')
                .eq('id', user.id)
                .single();

            if (!profile || profile.user_roles !== 'admin') {
                throw new Error('Admin privileges required');
            }

            // Insert article
            const { data: articleData, error: insertError } = await supabase
                .from('articles')
                .insert({
                    title: title.trim(),
                    content: content.trim(),
                    user_id: user.id,
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`Failed to create article: ${insertError.message}`);
            }

            const articleId = articleData.id;

            // Upload images if any
            if (imageFiles.length > 0) {
                for (const imageFile of imageFiles) {
                    // Upload to storage
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `articles/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('report-image')
                        .upload(filePath, imageFile);

                    if (uploadError) {
                        console.error('Image upload failed:', uploadError);
                        continue; // Skip this image but continue with others
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('report-image')
                        .getPublicUrl(filePath);

                    // Insert into pictures table
                    const { data: pictureData, error: pictureError } = await supabase
                        .from('pictures')
                        .insert({
                            image_path: publicUrl,
                            parent_type: 'article',
                            parent_id: articleId,
                        })
                        .select()
                        .single();

                    if (pictureError) {
                        console.error('Failed to insert picture:', pictureError);
                        continue;
                    }

                    // Link article and picture
                    const { error: linkError } = await supabase
                        .from('article_pictures')
                        .insert({
                            article_id: articleId,
                            picture_id: pictureData.id,
                        });

                    if (linkError) {
                        console.error('Failed to link article and picture:', linkError);
                    }
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/articles');
            }, 2000);

        } catch (error: unknown) {
            console.error('Error creating article:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader title="Create Article" showNotifications={false} />

            <div className="max-w-4xl mx-auto px-4 py-6">
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
                                <p className="text-sm text-green-700">Article created successfully. Redirecting...</p>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200 p-6">
                        <h2 className="text-2xl font-bold text-foreground">Create New Article</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Write and publish news for Zamboanga City residents
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-base font-medium">
                                    Article Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Enter article title (minimum 10 characters)"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, title: '' }));
                                    }}
                                    className={`h-12 ${validationErrors.title ? 'border-red-500' : ''}`}
                                />
                                {validationErrors.title && (
                                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                                )}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="content" className="text-base font-medium">
                                        Article Content (Markdown) <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPreview(!showPreview)}
                                    >
                                        {showPreview ? (
                                            <>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Preview
                                            </>
                                        )}
                                    </Button>
                                </div>
                                
                                {showPreview ? (
                                    <Card className="p-6 min-h-[300px] bg-secondary/20">
                                        {content ? (
                                            <MarkdownRenderer content={content} />
                                        ) : (
                                            <p className="text-muted-foreground text-center py-20">
                                                Nothing to preview yet. Start writing your article in markdown format.
                                            </p>
                                        )}
                                    </Card>
                                ) : (
                                    <>
                                        <Textarea
                                            id="content"
                                            placeholder="Write your article content here in markdown format (minimum 50 characters)...\n\nExample:\n# Heading 1\n## Heading 2\n**Bold text**\n*Italic text*\n- List item\n```code block```"
                                            value={content}
                                            onChange={(e) => {
                                                setContent(e.target.value);
                                                setValidationErrors(prev => ({ ...prev, content: '' }));
                                            }}
                                            className={`min-h-[300px] resize-none font-mono text-sm ${validationErrors.content ? 'border-red-500' : ''}`}
                                        />
                                        <div className="flex justify-between items-center">
                                            {validationErrors.content ? (
                                                <p className="text-sm text-red-500">{validationErrors.content}</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {content.length} characters • Supports markdown formatting
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="images" className="text-base font-medium">
                                    Images (Optional)
                                </Label>
                                <div className={`border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors ${validationErrors.images ? 'border-red-500' : 'border-border'}`}>
                                    {imagePreviews.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <div className="relative w-full h-40">
                                                            <Image
                                                                src={preview}
                                                                alt={`Preview ${index + 1}`}
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeImage(index)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label htmlFor="images" className="block">
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <span className="cursor-pointer">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Add More Images
                                                    </span>
                                                </Button>
                                                <input
                                                    id="images"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label htmlFor="images" className="flex flex-col items-center cursor-pointer">
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                <Upload className="w-10 h-10 text-primary" />
                                            </div>
                                            <p className="text-base font-medium text-foreground mb-1">
                                                Click to upload images
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PNG, JPG up to 10MB each
                                            </p>
                                            <input
                                                id="images"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                                {validationErrors.images && (
                                    <p className="text-sm text-red-500">{validationErrors.images}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                    disabled={isLoading || success}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : success ? (
                                        'Created!'
                                    ) : (
                                        'Create Article'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12"
                                    onClick={() => router.back()}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
