import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface WeightEntry {
  id: number;
  weight_kg: number;
  entry_date: string;
  created_at: string;
}

interface AddWeightResponse {
  id: number;
  weight_kg: number;
  entry_date: string;
  created_at: string;
  comparison: 'increased' | 'decreased' | 'same' | null;
}

const API_URL = 'https://functions.poehali.dev/3565a915-b744-4b8f-8a1a-1b55bc7b25d2';

export default function Index() {
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bgColor, setBgColor] = useState('from-sky-400 to-sky-300');
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || parseFloat(weight) <= 0) {
      toast.error('Введи корректный вес');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight_kg: parseFloat(weight),
          entry_date: new Date().toISOString().split('T')[0]
        }),
      });

      const data: AddWeightResponse = await response.json();

      if (data.comparison === 'increased') {
        setBgColor('from-red-500 to-red-400');
        setNotification('ugly');
        setTimeout(() => setNotification(''), 3000);
      } else if (data.comparison === 'decreased') {
        setBgColor('from-sky-400 to-sky-300');
        setNotification('ты - бабочка');
        setTimeout(() => setNotification(''), 3000);
      }

      await fetchEntries();
      setWeight('');
      toast.success('Вес сохранён');
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} transition-all duration-1000 flex items-center justify-center p-4 relative`}>
      <div className="w-full max-w-md space-y-8">
        <form onSubmit={handleSubmit} className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight animate-fade-in">
            введи свой вес, бабочка
          </h1>

          <div className="flex gap-3 animate-scale-in">
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="кг"
              className="text-2xl h-16 text-center bg-white/90 backdrop-blur border-0 focus-visible:ring-2 focus-visible:ring-white/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="h-16 px-8 bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 backdrop-blur text-lg font-light"
            >
              {isLoading ? '...' : '→'}
            </Button>
          </div>
        </form>

        {notification && (
          <div className="text-center animate-scale-in">
            <p className="text-5xl md:text-6xl font-light text-white tracking-tight">
              {notification}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowHistory(!showHistory)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 transition-all duration-300 flex items-center justify-center text-4xl shadow-2xl hover:scale-110 transform"
        aria-label="История"
      >
        🦋
      </button>

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in z-50" onClick={() => setShowHistory(false)}>
          <Card className="w-full max-w-md max-h-[80vh] overflow-auto bg-white/95 backdrop-blur p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-gray-800">История весов</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Пока нет записей</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <span className="font-light text-gray-600">
                      {new Date(entry.entry_date).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="text-2xl font-light text-purple-600">
                      {entry.weight_kg} кг
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
