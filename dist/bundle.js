var app = (function (require$$0, require$$1, require$$2, require$$3, require$$4) {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* src/components/NodeConnection.svelte generated by Svelte v3.59.2 */

    function create_fragment$5(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t4;
    	let p1;
    	let t5;
    	let t6;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Node Connection";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `Node Address: ${nodeAddress}`;
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Status: ");
    			t6 = text(/*nodeStatus*/ ctx[0]);
    			t7 = space();
    			button = element("button");
    			button.textContent = "Connect to Node";
    			attr(h2, "class", "text-xl font-bold mb-4");
    			attr(button, "class", "btn btn-primary mt-4");
    			attr(div, "class", "bg-white shadow-md rounded-lg p-6");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h2);
    			append(div, t1);
    			append(div, p0);
    			append(div, t4);
    			append(div, p1);
    			append(p1, t5);
    			append(p1, t6);
    			append(div, t7);
    			append(div, button);

    			if (!mounted) {
    				dispose = listen(button, "click", /*connectToNode*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*nodeStatus*/ 1) set_data(t6, /*nodeStatus*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    let nodeAddress = 'http://localhost:8545';

    function instance$4($$self, $$props, $$invalidate) {
    	let nodeStatus = 'Connecting...';

    	function connectToNode() {
    		// Código para conectarse al nodo y actualizar el estado
    		$$invalidate(0, nodeStatus = 'Connected');
    	}

    	return [nodeStatus, connectToNode];
    }

    class NodeConnection extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src/components/WalletCreation.svelte generated by Svelte v3.59.2 */

    function create_fragment$4(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Create Wallet";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Wallet Name";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Wallet Password";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button = element("button");
    			button.textContent = "Create Wallet";
    			attr(h2, "class", "text-xl font-bold mb-4");
    			attr(label0, "for", "walletName");
    			attr(label0, "class", "block font-bold mb-2");
    			attr(input0, "type", "text");
    			attr(input0, "id", "walletName");
    			attr(input0, "class", "input input-bordered w-full max-w-xs");
    			attr(div0, "class", "mb-4");
    			attr(label1, "for", "walletPassword");
    			attr(label1, "class", "block font-bold mb-2");
    			attr(input1, "type", "password");
    			attr(input1, "id", "walletPassword");
    			attr(input1, "class", "input input-bordered w-full max-w-xs");
    			attr(div1, "class", "mb-4");
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary");
    			attr(div2, "class", "bg-white shadow-md rounded-lg p-6");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, h2);
    			append(div2, t1);
    			append(div2, form);
    			append(form, div0);
    			append(div0, label0);
    			append(div0, t3);
    			append(div0, input0);
    			set_input_value(input0, /*walletName*/ ctx[0]);
    			append(form, t4);
    			append(form, div1);
    			append(div1, label1);
    			append(div1, t6);
    			append(div1, input1);
    			set_input_value(input1, /*walletPassword*/ ctx[1]);
    			append(form, t7);
    			append(form, button);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen(form, "submit", prevent_default(/*createWallet*/ ctx[2]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*walletName*/ 1 && input0.value !== /*walletName*/ ctx[0]) {
    				set_input_value(input0, /*walletName*/ ctx[0]);
    			}

    			if (dirty & /*walletPassword*/ 2 && input1.value !== /*walletPassword*/ ctx[1]) {
    				set_input_value(input1, /*walletPassword*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let walletName = '';
    	let walletPassword = '';

    	function createWallet() {
    		// Código para crear una nueva billetera y guardar la configuración
    		console.log(`Created wallet: ${walletName}`);
    	}

    	function input0_input_handler() {
    		walletName = this.value;
    		$$invalidate(0, walletName);
    	}

    	function input1_input_handler() {
    		walletPassword = this.value;
    		$$invalidate(1, walletPassword);
    	}

    	return [
    		walletName,
    		walletPassword,
    		createWallet,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class WalletCreation extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, {});
    	}
    }

    var wallet;
    var hasRequiredWallet;

    function requireWallet () {
    	if (hasRequiredWallet) return wallet;
    	hasRequiredWallet = 1;
    	const bitcoin = require$$0;
    	const { BIP32Factory } = require$$1;
    	const ecc = require$$2;
    	const bip39 = require$$3;
    	const axios = require$$4;

    	// Initialize bip32 with ecc
    	const bip32 = BIP32Factory(ecc);

    	// Using testnet for development and testing
    	const network = bitcoin.networks.testnet;
    	const apiBaseUrl = 'https://api.blockcypher.com/v1/btc/test3';

    	class BitcoinWallet {
    	    constructor() {
    	        this.mnemonic = null;
    	        this.wallet = null;
    	        this.address = null;
    	    }

    	    // Generate new wallet with mnemonic phrase
    	    async generateWallet() {
    	        try {
    	            // Generate mnemonic
    	            this.mnemonic = bip39.generateMnemonic();
    	            const seed = await bip39.mnemonicToSeed(this.mnemonic);
    	            
    	            // Generate root wallet from seed
    	            const root = bip32.fromSeed(seed, network);
    	            
    	            // Derive the first account's node (m/44'/1'/0'/0/0)
    	            const child = root.derivePath("m/44'/1'/0'/0/0");
    	            
    	            this.wallet = child;
    	            
    	            // Generate address from public key
    	            this.address = bitcoin.payments.p2pkh({
    	                pubkey: child.publicKey,
    	                network: network,
    	            }).address;

    	            return {
    	                mnemonic: this.mnemonic,
    	                address: this.address
    	            };
    	        } catch (error) {
    	            throw new Error(`Error generating wallet: ${error.message}`);
    	        }
    	    }

    	    // Import wallet from mnemonic
    	    async importFromMnemonic(mnemonic) {
    	        try {
    	            const seed = await bip39.mnemonicToSeed(mnemonic);
    	            const root = bip32.fromSeed(seed, network);
    	            const child = root.derivePath("m/44'/1'/0'/0/0");
    	            
    	            this.mnemonic = mnemonic;
    	            this.wallet = child;
    	            this.address = bitcoin.payments.p2pkh({
    	                pubkey: child.publicKey,
    	                network: network,
    	            }).address;

    	            return this.address;
    	        } catch (error) {
    	            throw new Error(`Error importing wallet: ${error.message}`);
    	        }
    	    }

    	    // Get wallet balance
    	    async getBalance() {
    	        try {
    	            if (!this.address) {
    	                throw new Error('Wallet not initialized');
    	            }

    	            const response = await axios.get(`${apiBaseUrl}/addrs/${this.address}/balance`);
    	            // Convert satoshis to BTC
    	            const balanceBTC = response.data.balance / 100000000;
    	            return balanceBTC;
    	        } catch (error) {
    	            throw new Error(`Error getting balance: ${error.message}`);
    	        }
    	    }

    	    // Get wallet address
    	    getAddress() {
    	        if (!this.address) {
    	            throw new Error('Wallet not initialized');
    	        }
    	        return this.address;
    	    }

    	    // Basic function to create and broadcast a transaction
    	    async sendBitcoin(toAddress, amountBTC) {
    	        try {
    	            if (!this.wallet) {
    	                throw new Error('Wallet not initialized');
    	            }

    	            // Get UTXOs
    	            const utxosResponse = await axios.get(`${apiBaseUrl}/addrs/${this.address}?unspentOnly=true`);
    	            const utxos = utxosResponse.data.txrefs || [];

    	            if (utxos.length === 0) {
    	                throw new Error('No unspent outputs found');
    	            }

    	            // Create transaction
    	            const psbt = new bitcoin.Psbt({ network });
    	            
    	            // Add inputs
    	            let totalAmount = 0;
    	            for (const utxo of utxos) {
    	                const txHex = await axios.get(`${apiBaseUrl}/txs/${utxo.tx_hash}`);
    	                psbt.addInput({
    	                    hash: utxo.tx_hash,
    	                    index: utxo.tx_output_n,
    	                    nonWitnessUtxo: Buffer.from(txHex.data.hex, 'hex'),
    	                });
    	                totalAmount += utxo.value;
    	            }

    	            // Convert BTC to satoshis
    	            const amountSatoshis = Math.floor(amountBTC * 100000000);
    	            const fee = 10000; // 0.0001 BTC fee
    	            
    	            if (totalAmount < amountSatoshis + fee) {
    	                throw new Error('Insufficient funds');
    	            }

    	            // Add outputs
    	            psbt.addOutput({
    	                address: toAddress,
    	                value: amountSatoshis,
    	            });
    	            
    	            // Add change output if necessary
    	            const change = totalAmount - amountSatoshis - fee;
    	            if (change > 0) {
    	                psbt.addOutput({
    	                    address: this.address,
    	                    value: change,
    	                });
    	            }

    	            // Sign inputs
    	            utxos.forEach((_, index) => {
    	                psbt.signInput(index, this.wallet);
    	            });

    	            psbt.finalizeAllInputs();

    	            // Build and broadcast
    	            const tx = psbt.extractTransaction();
    	            const txHex = tx.toHex();

    	            // Broadcast transaction
    	            const broadcastResponse = await axios.post(`${apiBaseUrl}/tx/push`, {
    	                tx: txHex
    	            });

    	            return broadcastResponse.data.tx.hash;
    	        } catch (error) {
    	            throw new Error(`Error sending bitcoin: ${error.message}`);
    	        }
    	    }
    	}

    	wallet = BitcoinWallet;
    	return wallet;
    }

    var walletExports = requireWallet();

    /* src/components/WalletDashboard.svelte generated by Svelte v3.59.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (54:6) {#each transactionHistory as transaction}
    function create_each_block(ctx) {
    	let li;
    	let span0;

    	let t0_value = (/*transaction*/ ctx[6].type === 'receive'
    	? 'Received'
    	: 'Sent') + "";

    	let t0;
    	let t1;
    	let t2_value = /*transaction*/ ctx[6].amount.toFixed(2) + "";
    	let t2;
    	let t3;
    	let span1;

    	let t4_value = (/*transaction*/ ctx[6].type === 'receive'
    	? 'from'
    	: 'to') + "";

    	let t4;
    	let t5;
    	let t6_value = (/*transaction*/ ctx[6].sender || /*transaction*/ ctx[6].recipient) + "";
    	let t6;
    	let t7;

    	return {
    		c() {
    			li = element("li");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(" $");
    			t2 = text(t2_value);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			toggle_class(span0, "text-green-500", /*transaction*/ ctx[6].type === 'receive');
    			toggle_class(span0, "text-red-500", /*transaction*/ ctx[6].type === 'send');
    			attr(li, "class", "flex justify-between items-center mb-2");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, span0);
    			append(span0, t0);
    			append(span0, t1);
    			append(span0, t2);
    			append(li, t3);
    			append(li, span1);
    			append(span1, t4);
    			append(span1, t5);
    			append(span1, t6);
    			append(li, t7);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*transactionHistory*/ 2 && t0_value !== (t0_value = (/*transaction*/ ctx[6].type === 'receive'
    			? 'Received'
    			: 'Sent') + "")) set_data(t0, t0_value);

    			if (dirty & /*transactionHistory*/ 2 && t2_value !== (t2_value = /*transaction*/ ctx[6].amount.toFixed(2) + "")) set_data(t2, t2_value);

    			if (dirty & /*transactionHistory*/ 2) {
    				toggle_class(span0, "text-green-500", /*transaction*/ ctx[6].type === 'receive');
    			}

    			if (dirty & /*transactionHistory*/ 2) {
    				toggle_class(span0, "text-red-500", /*transaction*/ ctx[6].type === 'send');
    			}

    			if (dirty & /*transactionHistory*/ 2 && t4_value !== (t4_value = (/*transaction*/ ctx[6].type === 'receive'
    			? 'from'
    			: 'to') + "")) set_data(t4, t4_value);

    			if (dirty & /*transactionHistory*/ 2 && t6_value !== (t6_value = (/*transaction*/ ctx[6].sender || /*transaction*/ ctx[6].recipient) + "")) set_data(t6, t6_value);
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let t3_value = /*balance*/ ctx[0].toFixed(2) + "";
    	let t3;
    	let t4;
    	let div0;
    	let h20;
    	let t6;
    	let form0;
    	let t10;
    	let div1;
    	let h21;
    	let t12;
    	let form1;
    	let t16;
    	let div2;
    	let h22;
    	let t18;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*transactionHistory*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Wallet Dashboard";
    			t1 = space();
    			p = element("p");
    			t2 = text("Balance: $");
    			t3 = text(t3_value);
    			t4 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Send Money";
    			t6 = space();
    			form0 = element("form");

    			form0.innerHTML = `<input type="number" placeholder="Amount" class="input input-bordered w-full max-w-xs mb-2"/> 
      <input type="text" placeholder="Recipient" class="input input-bordered w-full max-w-xs mb-2"/> 
      <button type="submit" class="btn btn-primary">Send</button>`;

    			t10 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Receive Money";
    			t12 = space();
    			form1 = element("form");

    			form1.innerHTML = `<input type="number" placeholder="Amount" class="input input-bordered w-full max-w-xs mb-2"/> 
      <input type="text" placeholder="Sender" class="input input-bordered w-full max-w-xs mb-2"/> 
      <button type="submit" class="btn btn-primary">Receive</button>`;

    			t16 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Transaction History";
    			t18 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(h1, "class", "text-2xl font-bold mb-4");
    			attr(p, "class", "text-4xl font-bold mb-6");
    			attr(h20, "class", "text-xl font-bold mb-2");
    			attr(div0, "class", "mb-6");
    			attr(h21, "class", "text-xl font-bold mb-2");
    			attr(h22, "class", "text-xl font-bold mb-2");
    			attr(div2, "class", "mt-6");
    			attr(main, "class", "bg-white shadow-md rounded-lg p-6");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, h1);
    			append(main, t1);
    			append(main, p);
    			append(p, t2);
    			append(p, t3);
    			append(main, t4);
    			append(main, div0);
    			append(div0, h20);
    			append(div0, t6);
    			append(div0, form0);
    			append(main, t10);
    			append(main, div1);
    			append(div1, h21);
    			append(div1, t12);
    			append(div1, form1);
    			append(main, t16);
    			append(main, div2);
    			append(div2, h22);
    			append(div2, t18);
    			append(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen(form0, "submit", prevent_default(/*submit_handler*/ ctx[4])),
    					listen(form1, "submit", prevent_default(/*submit_handler_1*/ ctx[5]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*balance*/ 1 && t3_value !== (t3_value = /*balance*/ ctx[0].toFixed(2) + "")) set_data(t3, t3_value);

    			if (dirty & /*transactionHistory*/ 2) {
    				each_value = /*transactionHistory*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let balance = 1000;

    	let transactionHistory = [
    		{
    			id: 1,
    			type: 'send',
    			amount: 50,
    			recipient: 'John Doe'
    		},
    		{
    			id: 2,
    			type: 'receive',
    			amount: 75,
    			sender: 'Jane Smith'
    		}
    	];

    	function handleSendMoney(amount, recipient) {
    		walletExports.sendMoney(amount, recipient);
    		$$invalidate(0, balance -= amount);

    		$$invalidate(1, transactionHistory = [
    			{
    				id: transactionHistory.length + 1,
    				type: 'send',
    				amount,
    				recipient
    			},
    			...transactionHistory
    		]);
    	}

    	function handleReceiveMoney(amount, sender) {
    		walletExports.receiveMoney(amount, sender);
    		$$invalidate(0, balance += amount);

    		$$invalidate(1, transactionHistory = [
    			{
    				id: transactionHistory.length + 1,
    				type: 'receive',
    				amount,
    				sender
    			},
    			...transactionHistory
    		]);
    	}

    	const submit_handler = () => handleSendMoney(50, 'John Doe');
    	const submit_handler_1 = () => handleReceiveMoney(75, 'Jane Smith');

    	return [
    		balance,
    		transactionHistory,
    		handleSendMoney,
    		handleReceiveMoney,
    		submit_handler,
    		submit_handler_1
    	];
    }

    class WalletDashboard extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src/components/SendMoneyForm.svelte generated by Svelte v3.59.2 */

    function create_fragment$2(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Send Money";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Amount";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Recipient";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button = element("button");
    			button.textContent = "Send";
    			attr(h2, "class", "text-xl font-bold mb-4");
    			attr(label0, "for", "amount");
    			attr(label0, "class", "block font-bold mb-2");
    			attr(input0, "type", "number");
    			attr(input0, "id", "amount");
    			attr(input0, "class", "input input-bordered w-full max-w-xs");
    			attr(div0, "class", "mb-4");
    			attr(label1, "for", "recipient");
    			attr(label1, "class", "block font-bold mb-2");
    			attr(input1, "type", "text");
    			attr(input1, "id", "recipient");
    			attr(input1, "class", "input input-bordered w-full max-w-xs");
    			attr(div1, "class", "mb-4");
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary");
    			attr(div2, "class", "bg-white shadow-md rounded-lg p-6");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, h2);
    			append(div2, t1);
    			append(div2, form);
    			append(form, div0);
    			append(div0, label0);
    			append(div0, t3);
    			append(div0, input0);
    			set_input_value(input0, /*amount*/ ctx[0]);
    			append(form, t4);
    			append(form, div1);
    			append(div1, label1);
    			append(div1, t6);
    			append(div1, input1);
    			set_input_value(input1, /*recipient*/ ctx[1]);
    			append(form, t7);
    			append(form, button);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen(form, "submit", prevent_default(/*handleSendMoney*/ ctx[2]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*amount*/ 1 && to_number(input0.value) !== /*amount*/ ctx[0]) {
    				set_input_value(input0, /*amount*/ ctx[0]);
    			}

    			if (dirty & /*recipient*/ 2 && input1.value !== /*recipient*/ ctx[1]) {
    				set_input_value(input1, /*recipient*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let amount = 0;
    	let recipient = '';

    	function handleSendMoney() {
    		walletExports.sendMoney(amount, recipient);
    		$$invalidate(0, amount = 0);
    		$$invalidate(1, recipient = '');
    	}

    	function input0_input_handler() {
    		amount = to_number(this.value);
    		$$invalidate(0, amount);
    	}

    	function input1_input_handler() {
    		recipient = this.value;
    		$$invalidate(1, recipient);
    	}

    	return [amount, recipient, handleSendMoney, input0_input_handler, input1_input_handler];
    }

    class SendMoneyForm extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src/components/ReceiveMoneyForm.svelte generated by Svelte v3.59.2 */

    function create_fragment$1(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Receive Money";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Amount";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Sender";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button = element("button");
    			button.textContent = "Receive";
    			attr(h2, "class", "text-xl font-bold mb-4");
    			attr(label0, "for", "amount");
    			attr(label0, "class", "block font-bold mb-2");
    			attr(input0, "type", "number");
    			attr(input0, "id", "amount");
    			attr(input0, "class", "input input-bordered w-full max-w-xs");
    			attr(div0, "class", "mb-4");
    			attr(label1, "for", "sender");
    			attr(label1, "class", "block font-bold mb-2");
    			attr(input1, "type", "text");
    			attr(input1, "id", "sender");
    			attr(input1, "class", "input input-bordered w-full max-w-xs");
    			attr(div1, "class", "mb-4");
    			attr(button, "type", "submit");
    			attr(button, "class", "btn btn-primary");
    			attr(div2, "class", "bg-white shadow-md rounded-lg p-6");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, h2);
    			append(div2, t1);
    			append(div2, form);
    			append(form, div0);
    			append(div0, label0);
    			append(div0, t3);
    			append(div0, input0);
    			set_input_value(input0, /*amount*/ ctx[0]);
    			append(form, t4);
    			append(form, div1);
    			append(div1, label1);
    			append(div1, t6);
    			append(div1, input1);
    			set_input_value(input1, /*sender*/ ctx[1]);
    			append(form, t7);
    			append(form, button);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen(form, "submit", prevent_default(/*handleReceiveMoney*/ ctx[2]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*amount*/ 1 && to_number(input0.value) !== /*amount*/ ctx[0]) {
    				set_input_value(input0, /*amount*/ ctx[0]);
    			}

    			if (dirty & /*sender*/ 2 && input1.value !== /*sender*/ ctx[1]) {
    				set_input_value(input1, /*sender*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let amount = 0;
    	let sender = '';

    	function handleReceiveMoney() {
    		walletExports.receiveMoney(amount, sender);
    		$$invalidate(0, amount = 0);
    		$$invalidate(1, sender = '');
    	}

    	function input0_input_handler() {
    		amount = to_number(this.value);
    		$$invalidate(0, amount);
    	}

    	function input1_input_handler() {
    		sender = this.value;
    		$$invalidate(1, sender);
    	}

    	return [amount, sender, handleReceiveMoney, input0_input_handler, input1_input_handler];
    }

    class ReceiveMoneyForm extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div0;
    	let nodeconnection;
    	let t0;
    	let walletcreation;
    	let t1;
    	let div2;
    	let walletdashboard;
    	let t2;
    	let div1;
    	let sendmoneyform;
    	let t3;
    	let receivemoneyform;
    	let current;
    	nodeconnection = new NodeConnection({});
    	walletcreation = new WalletCreation({});
    	walletdashboard = new WalletDashboard({});
    	sendmoneyform = new SendMoneyForm({});
    	receivemoneyform = new ReceiveMoneyForm({});

    	return {
    		c() {
    			main = element("main");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(nodeconnection.$$.fragment);
    			t0 = space();
    			create_component(walletcreation.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(walletdashboard.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(sendmoneyform.$$.fragment);
    			t3 = space();
    			create_component(receivemoneyform.$$.fragment);
    			attr(div1, "class", "flex justify-between mt-6");
    			attr(div3, "class", "grid grid-cols-2 gap-6");
    			attr(main, "class", "flex flex-col items-center justify-center h-screen bg-gray-100");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div3);
    			append(div3, div0);
    			mount_component(nodeconnection, div0, null);
    			append(div0, t0);
    			mount_component(walletcreation, div0, null);
    			append(div3, t1);
    			append(div3, div2);
    			mount_component(walletdashboard, div2, null);
    			append(div2, t2);
    			append(div2, div1);
    			mount_component(sendmoneyform, div1, null);
    			append(div1, t3);
    			mount_component(receivemoneyform, div1, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(nodeconnection.$$.fragment, local);
    			transition_in(walletcreation.$$.fragment, local);
    			transition_in(walletdashboard.$$.fragment, local);
    			transition_in(sendmoneyform.$$.fragment, local);
    			transition_in(receivemoneyform.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(nodeconnection.$$.fragment, local);
    			transition_out(walletcreation.$$.fragment, local);
    			transition_out(walletdashboard.$$.fragment, local);
    			transition_out(sendmoneyform.$$.fragment, local);
    			transition_out(receivemoneyform.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(nodeconnection);
    			destroy_component(walletcreation);
    			destroy_component(walletdashboard);
    			destroy_component(sendmoneyform);
    			destroy_component(receivemoneyform);
    		}
    	};
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})(require$$0, require$$1, require$$2, require$$3, require$$4);
