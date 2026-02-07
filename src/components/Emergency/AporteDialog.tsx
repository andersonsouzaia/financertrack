import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpCircle } from "lucide-react";

interface AporteDialogProps {
    onRegisterAporte: (amount: number, destination: string) => Promise<void>;
    suggestionAmount?: number;
}

export function AporteDialog({ onRegisterAporte, suggestionAmount }: AporteDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(suggestionAmount ? suggestionAmount.toString() : "");
    const [destination, setDestination] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!amount) return;

        setIsSubmitting(true);
        try {
            await onRegisterAporte(Number(amount), destination);
            setOpen(false);
            setAmount("");
            setDestination("");
        } catch (error) {
            console.error("Error registering aporte:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <ArrowUpCircle className="h-4 w-4" />
                    Novo Aporte
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <ArrowUpCircle className="h-5 w-5" />
                        Adicionar à Reserva
                    </DialogTitle>
                    <DialogDescription>
                        Construa sua segurança degrau por degrau.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="aporte-amount" className="text-right">
                            Valor
                        </Label>
                        <Input
                            id="aporte-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="destination" className="text-right">
                            Destino
                        </Label>
                        <Input
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: CDB Banco Inter, Tesouro Selic..."
                        />
                        <p className="col-span-4 text-xs text-muted-foreground text-right">
                            Onde você guardou esse dinheiro?
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? "Salvando..." : "Confirmar Aporte"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
