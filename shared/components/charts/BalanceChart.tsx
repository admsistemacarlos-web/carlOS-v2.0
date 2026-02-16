import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BalanceData {
  name: string;
  balance: number;
}

interface BalanceChartProps {
  data?: BalanceData[];
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'Sem Dados', balance: 0 }
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground tracking-tight">Evolução do Saldo</h3>
      {/* Container pai com altura explícita para o ResponsiveContainer */}
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5F6F52" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#5F6F52" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#3C3633" 
              fontSize={10} 
              fontWeight={600} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#3C3633" 
              fontSize={10} 
              fontWeight={600} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                border: '1px solid #f1f1f1', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                fontSize: '12px',
                fontWeight: '600'
              }}
              itemStyle={{ color: '#5F6F52' }}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#5F6F52" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart;