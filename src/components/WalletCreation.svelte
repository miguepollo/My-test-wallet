<script>
  let walletName = '';
  let walletPassword = '';

  function createWallet() {
    // Código para crear una nueva billetera y guardar la configuración
    console.log(`Created wallet: ${walletName}`);
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h2 class="text-xl font-bold mb-4">Create Wallet</h2>
  <form on:submit|preventDefault={createWallet}>
    <div class="mb-4">
      <label for="walletName" class="block font-bold mb-2">Wallet Name</label>
      <input type="text" id="walletName" bind:value={walletName} class="input input-bordered w-full max-w-xs" />
    </div>
    <div class="mb-4">
      <label for="walletPassword" class="block font-bold mb-2">Wallet Password</label>
      <input type="password" id="walletPassword" bind:value={walletPassword} class="input input-bordered w-full max-w-xs" />
    </div>
    <button type="submit" class="btn btn-primary">Create Wallet</button>
  </form>
</div>
