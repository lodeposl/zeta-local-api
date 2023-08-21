export const PRODUCT_BY_CODE = function(ItemCode){
    return `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=3 
        and OITM.ItemCode='${ItemCode}'`
}

export const FIRM_AND_COUNT = function(ItemCode){
    return `
    select
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by amountProducts desc`
}