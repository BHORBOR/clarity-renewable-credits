;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-listed (err u102))
(define-constant err-insufficient-credits (err u103))
(define-constant err-invalid-price (err u104))
(define-constant err-expired (err u105))
(define-constant err-invalid-batch (err u106))

;; Define credit token
(define-fungible-token renewable-credit)

;; Data variables
(define-map credit-listings
    { credit-id: uint }
    { 
      owner: principal, 
      quantity: uint, 
      price-per-unit: uint,
      expiration: uint,
      batch-id: (optional uint)
    }
)

(define-map credit-batches
    { batch-id: uint }
    {
      source: (string-ascii 64),
      generation-date: uint,
      total-quantity: uint,
      remaining-quantity: uint
    }
)

(define-data-var next-credit-id uint u1)
(define-data-var next-batch-id uint u1)

;; Read only functions
(define-read-only (get-credit-listing (credit-id uint))
    (map-get? credit-listings { credit-id: credit-id })
)

(define-read-only (get-credit-balance (account principal))
    (ok (ft-get-balance renewable-credit account))
)

(define-read-only (get-credit-batch (batch-id uint))
    (map-get? credit-batches { batch-id: batch-id })
)

;; Public functions
(define-public (create-credit-batch (source (string-ascii 64)) (quantity uint))
    (let (
        (batch-id (var-get next-batch-id))
        (block-height (get-block-height))
    )
    (if (is-eq tx-sender contract-owner)
        (begin
            (try! (ft-mint? renewable-credit quantity contract-owner))
            (map-insert credit-batches
                { batch-id: batch-id }
                {
                    source: source,
                    generation-date: block-height,
                    total-quantity: quantity,
                    remaining-quantity: quantity
                }
            )
            (var-set next-batch-id (+ batch-id u1))
            (ok batch-id)
        )
        err-owner-only
    ))
)

(define-public (list-credits (quantity uint) (price-per-unit uint) (expiration uint) (batch-id (optional uint)))
    (let (
        (credit-id (var-get next-credit-id))
        (seller-balance (ft-get-balance renewable-credit tx-sender))
        (block-height (get-block-height))
    )
    (if (and 
        (>= seller-balance quantity)
        (> expiration block-height)
        (match batch-id
            batch-id (is-some (get-credit-batch batch-id))
            true
        ))
        (begin
            (map-insert credit-listings
                { credit-id: credit-id }
                { 
                  owner: tx-sender, 
                  quantity: quantity, 
                  price-per-unit: price-per-unit,
                  expiration: expiration,
                  batch-id: batch-id
                }
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
        (block-height (get-block-height))
    )
    (if (< block-height (get expiration listing))
        (if (<= quantity (get quantity listing))
            (begin
                (try! (stx-transfer? total-price tx-sender seller))
                (try! (ft-transfer? renewable-credit quantity seller tx-sender))
                (match (get batch-id listing)
                    batch-id (map-set credit-batches
                        { batch-id: batch-id }
                        (merge (unwrap! (get-credit-batch batch-id) err-not-found)
                            { remaining-quantity: (- (get remaining-quantity (unwrap! (get-credit-batch batch-id) err-not-found)) quantity) }
                        ))
                    true
                )
                (ok true)
            )
            err-insufficient-credits
        )
        err-expired
    ))
)

(define-public (transfer-credits (amount uint) (recipient principal))
    (ft-transfer? renewable-credit amount tx-sender recipient)
)
