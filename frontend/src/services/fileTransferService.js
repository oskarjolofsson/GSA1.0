let file = null;

export const fileTransferService = {
    setFile: (f) => { file = f; },
    getFile: () => {
        const f = file;
        file = null;
        return f;
    },
    hasFile: () => !!file
};
