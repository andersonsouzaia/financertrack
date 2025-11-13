import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingStep2({ data, onDataChange }) {
  const [formData, setFormData] = useState(data);
  const [date, setDate] = useState(data.data_nascimento ? new Date(data.data_nascimento) : undefined);
  const [month, setMonth] = useState(new Date());

  // Sync com estado pai em tempo real
  useEffect(() => {
    onDataChange(formData);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, data_nascimento: formattedDate }));
    }
  };

  // Gera anos de 1924 até ano atual
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1924 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          👤 Conte-nos sobre você
        </h2>
        <p className="text-muted-foreground">
          Essas informações nos ajudam a personalizar sua experiência
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.nome_completo}
            onChange={(e) => handleChange('nome_completo', e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Data de Nascimento (opcional)
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-border flex gap-2">
                <Select
                  value={month.getMonth().toString()}
                  onValueChange={(value) => {
                    const newMonth = new Date(month);
                    newMonth.setMonth(parseInt(value));
                    setMonth(newMonth);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {format(new Date(2000, i), "MMMM", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={month.getFullYear().toString()}
                  onValueChange={(value) => {
                    const newMonth = new Date(month);
                    newMonth.setFullYear(parseInt(value));
                    setMonth(newMonth);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-[300px]"
                    position="popper"
                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                  >
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                month={month}
                onMonthChange={setMonth}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            País *
          </label>
          <select
            value={formData.pais}
            onChange={(e) => handleChange('pais', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Brasil">Brasil</option>
            <option value="Portugal">Portugal</option>
            <option value="Angola">Angola</option>
            <option value="Moçambique">Moçambique</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Moeda Principal *
          </label>
          <select
            value={formData.moeda_principal}
            onChange={(e) => handleChange('moeda_principal', e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="BRL">BRL - Real Brasileiro</option>
            <option value="USD">USD - Dólar Americano</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - Libra Esterlina</option>
            <option value="AOA">AOA - Kwanza Angolano</option>
            <option value="MZN">MZN - Metical Moçambicano</option>
          </select>
        </div>
      </div>
    </div>
  );
}
