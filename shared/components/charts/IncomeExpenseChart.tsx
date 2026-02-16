import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  name: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data?: MonthlyData[];
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'Jan', income: 0, expense: 0 }
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground tracking-tight">Receitas vs Despesas</h3>
      {/* Container pai com altura explícita para o ResponsiveContainer */}
      <div className="h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barGap={8}
          >
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
            />
            <Tooltip 
               cursor={{fill: '#faf9f6'}}
               contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                border: '1px solid #f1f1f1', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                fontSize: '12px',
                fontWeight: '600'
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px' }}
            />
            <Bar dataKey="income" name="Receitas" fill="#5F6F52" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Despesas" fill="#A34343" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;