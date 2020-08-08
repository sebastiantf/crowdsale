// App - app object
App = {
    contracts: {},
    loading: false,
    load: async () => {
        await App.loadWeb3();
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    loadWeb3: async () => {
        window.alert("loadWeb3")
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                // Request account access if needed
                await ethereum.enable();
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            window.web3 = new Web3(web3.currentProvider);
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    },

    loadAccount: async () => {
        window.alert("loadAccount")
        web3.eth.getCoinbase(function (error, account) {
            if (error === null) {
                App.account = account;
                $(".account-address").html(account);
                console.log("Connected Account: ", account);
            } else {
                console.log(error);
            }
        });
    },

    loadContract: async () => {
        window.alert("loadContract")
        const abi = await $.getJSON('CrowdSale.json')
        const contractAddress = '0x085de6CbDdF9678924016ABB43a1c72D2d98dd7d'

        App.contracts.CrowdSaleContract = TruffleContract({
            abi: abi,
            address: contractAddress
        });

        App.contracts.CrowdSaleContract.setProvider(App.web3Provider);

        App.CrowdSaleInstance = await App.contracts.CrowdSaleContract.at(contractAddress);
        console.log(App.CrowdSaleInstance);
    },

    render: async () => {
        window.alert("render")
        if (App.loading) {
            return
        }

        // Loading
        App.setLoading(true);

        $('#account').html(App.account);
        await App.setRemainingTokens();
        App.toggleBuyButton();

        // Loading finished
        App.setLoading(false);
    },

    setRemainingTokens: async () => {
        let result = (await App.CrowdSaleInstance.remainingTokens()).toNumber();
        const remainingTokens = (result/(10**9)).toFixed(9);

        $('#remainingTokens').html(remainingTokens);
    },

    calculateReceiveAmount: async () => {
        let inputAmount = $("#input-amount").val();
        if(inputAmount) {
            let inputAmountInWei = web3.toWei(parseFloat(inputAmount));
            try {
                let result = (await App.CrowdSaleInstance._getTokenAmount(inputAmountInWei)).toNumber();
                const receiveAmount = (result/(10**9)).toFixed(9);
                $('#receive-amount').val(receiveAmount);
            } catch (error) {
                console.error(error)
                $('#receive-amount').val('');
            }
        } else {
            $('#receive-amount').val('');
        }
    },

    toggleBuyButton: () => {
        if (App.account) {
            console.log("App.account exists");
            $("#connect-wallet-btn").hide()
            $("#buy-btn").show()
        } else {
            console.log("App.account doesn't exists");
            $("#connect-wallet-btn").show()
            $("#buy-btn").hide()
        }
    },

    setLoading: (loading) => {
        window.alert("setLoading")
        App.loading = loading;

        if (App.loading) {
            $('#loader').show();
            $('#content').hide();
        } else {
            $('#loader').hide();
            $('#content').show();
        }
    },

    reload: async () => {
        App.account = '';
        await App.loadAccount();
        await App.render();
    }
}

$(() => {
    $(window).on('load', async () => {
        await App.load();
        ethereum.on('accountsChanged', async function (accounts) {
            await App.reload();
          });
    });
});