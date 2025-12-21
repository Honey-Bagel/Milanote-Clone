export class PerformanceTimer {
	private startTime: number;
	private marks: Map<string, number> = new Map();
	private label: string;

	constructor(label: string) {
		this.label = label;
		this.startTime = performance.now();
	}

	mark(label: string): void {
		this.marks.set(label, performance.now() - this.startTime);
	}

	end(): { total: number; marks: Record<string, number> } {
		const total = performance.now() - this.startTime;
		const marksObj: Record<string, number> = {};
		this.marks.forEach((time, label) => {
			marksObj[label] = Math.round(time);
		});
		return { total: Math.round(total), marks: marksObj };
	}

	log(): void {
		const { total, marks } = this.end();
		const warning = total > 200 ? '⚠️' : '';

		console.log(`[PERF] ${this.label} ${warning}`);

		let previousTime = 0;
		Object.entries(marks).forEach(([label, time]) => {
			const delta = time - previousTime;
			const deltaWarning = delta > 100 ? '⚠️' : delta > 50 ? '⚡' : '';
			console.log(`  ├─ ${label}: ${delta}ms ${deltaWarning}`);
			previousTime = time;
		});

		console.log(`  └─ 🏁 TOTAL: ${total}ms ${warning}`);
	}
}

export async function timeAsync<T>(
	label: string,
	fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
	const start = performance.now();
	const result = await fn();
	const duration = Math.round(performance.now() - start);
	return { result, duration };
}