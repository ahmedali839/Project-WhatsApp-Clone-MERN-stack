import { useEffect } from "react";


const useOutSideClick = (ref, callback) => {

    useEffect(() => {
        const outSideClicked = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }
        document.addEventListener("mousedown", outSideClicked)
        return () => {
            document.addEventListener("mousedown", outSideClicked)
        }
    }, [ref, callback])

}

export default useOutSideClick