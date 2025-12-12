import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, Send, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EmailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSend: (email: string, subject: string, message: string) => Promise<void>;
    defaultSubject?: string;
    defaultMessage?: string;
}

export function EmailModal({ open, onOpenChange, onSend, defaultSubject = "", defaultMessage = "" }: EmailModalProps) {
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState(defaultSubject);
    const [message, setMessage] = useState(defaultMessage);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSend = async () => {
        if (!email) {
            toast.error("Please enter a recipient email");
            return;
        }

        try {
            setSending(true);
            await onSend(email, subject, message);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onOpenChange(false);
                setEmail(""); // Reset
            }, 2000);
        } catch (error) {
            console.error("Email send error:", error);
            toast.error("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-[#1E2D4D]">Email Quotation</DialogTitle>
                    <DialogDescription>
                        Send this quotation PDF directly to your client.
                    </DialogDescription>
                </DialogHeader>

                {!success ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-[#1E2D4D]">Recipient Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="client@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="focus:ring-[#EF7E1E]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject" className="text-[#1E2D4D]">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="focus:ring-[#EF7E1E]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message" className="text-[#1E2D4D]">Message</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="resize-none focus:ring-[#EF7E1E]"
                            />
                        </div>

                        <div className="mt-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-md flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded">
                                <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Quotation.pdf</p>
                                <p className="text-xs text-gray-500">Attached automatically</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#1E2D4D]">Email Sent!</h3>
                        <p className="text-gray-500">Your quotation has been successfully sent to {email}.</p>
                    </div>
                )}

                {!success && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending}
                            className="bg-[#EF7E1E] hover:bg-[#EF7E1E]/90 text-white"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Email
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
