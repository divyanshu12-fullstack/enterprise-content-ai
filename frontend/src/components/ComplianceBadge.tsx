type ComplianceBadgeProps = {
    status: "APPROVED" | "REJECTED";
};

export default function ComplianceBadge({ status }: ComplianceBadgeProps) {
    const approved = status === "APPROVED";
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${approved ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}
        >
            {status}
        </span>
    );
}
