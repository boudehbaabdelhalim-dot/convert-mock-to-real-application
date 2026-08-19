"use client";

import { ReactNode } from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: ReactNode;
  className?: string;
}

const badgeVariants = {
  success: "bg-green-500/15 text-green-400 border-green-500/25",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  danger: "bg-red-500/15 text-red-400 border-red-500/25",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  neutral: "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
}

export function SectionHeader({ title, subtitle, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, color = "text-white", icon }: StatCardProps) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3">
      {icon && <div className="mb-2">{icon}</div>}
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-gray-500 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 20, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-4xl mb-4 opacity-50">{icon}</div>}
      <div className="text-gray-400 font-medium text-sm">{title}</div>
      {description && <div className="text-gray-600 text-xs mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 pb-5">{footer}</div>}
      </div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2.5 rounded-xl bg-gray-800 border ${error ? "border-red-500" : "border-gray-700"} text-white text-sm placeholder:text-gray-600 focus:border-blue-500 ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2.5 rounded-xl bg-gray-800 border ${error ? "border-red-500" : "border-gray-700"} text-white text-sm focus:border-blue-500 ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = "", ...props }: TextAreaProps) {
  return (
    <div>
      {label && (
        <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2.5 rounded-xl bg-gray-800 border ${error ? "border-red-500" : "border-gray-700"} text-white text-sm placeholder:text-gray-600 focus:border-blue-500 resize-none ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
