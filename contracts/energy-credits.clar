;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-listed (err u102))
(define-constant err-insufficient-credits (err u103))
(define-constant err-invalid-price (err u104))

;; Define credit token
(define-fungible-token renewable-credit)

;; Data variables
(define-map credit-listings
    { credit-id: uint }
    { owner: principal, quantity: uint, price-per-unit: uint }
)

(define-data-var next-credit-id uint u1)

;; Read only functions
(define-read-only (get-credit-listing (credit-id uint))
    (map-get? credit-listings { credit-id: credit-id })
)

(define-read-only (get-credit-balance (account principal))
    (ok (ft-get-balance renewable-credit account))
)

;; Public functions
(define-public (create-credits (recipient principal) (amount uint))
    (if (is-eq tx-sender contract-owner)
        (ft-mint? renewable-credit amount recipient)
        err-owner-only
    )
)

(define-public (list-credits (quantity uint) (price-per-unit uint))
    (let (
        (credit-id (var-get next-credit-id))
        (seller-balance (ft-get-balance renewable-credit tx-sender))
    )
    (if (>= seller-balance quantity)
        (begin
            (map-insert credit-listings
                { credit-id: credit-id }
                { owner: tx-sender, quantity: quantity, price-per-unit: price-per-unit }
            )
            (var-set next-credit-id (+ credit-id u1))
            (ok credit-id)
        )
        err-insufficient-credits
    ))
)

(define-public (buy-credits (credit-id uint) (quantity uint))
    (let (
        (listing (unwrap! (get-credit-listing credit-id) err-not-found))
        (total-price (* quantity (get price-per-unit listing)))
        (seller (get owner listing))
    )
    (if (<= quantity (get quantity listing))
        (begin
            (try! (stx-transfer? total-price tx-sender seller))
            (try! (ft-transfer? renewable-credit quantity seller tx-sender))
            (ok true)
        )
        err-insufficient-credits
    ))
)

(define-public (transfer-credits (amount uint) (recipient principal))
    (ft-transfer? renewable-credit amount tx-sender recipient)
)
