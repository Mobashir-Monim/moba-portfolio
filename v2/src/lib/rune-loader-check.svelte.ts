export function counter() {
	let n = $state(0);
	return {
		get value() {
			return n;
		},
		inc() {
			n++;
		}
	};
}
